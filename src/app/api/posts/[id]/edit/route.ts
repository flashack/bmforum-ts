import { NextRequest } from "next/server";
import { queryOne, execute, transaction } from "@/lib/db";
import { str, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { applyWordFilter } from "@/lib/moderation";

/** 事务客户端类型（与 db.ts transaction 回调参数一致） */
type TxClient = Parameters<Parameters<typeof transaction>[0]>[0];

/**
 * 复刻原版 post.php?journal=modify —— 帖子编辑
 * GET  /api/posts/[id]/edit  加载待编辑内容（作者本人或版主/管理员）
 * POST /api/posts/[id]/edit  保存编辑（首帖可改标题/简介/标签）
 */

/** 同步 thread_tags（旧标签计数 -1，新标签计数 +1） */
async function syncTags(c: TxClient, tid: number, tags: string) {
  const oldRows = await c.query<{ tagid: number }>("SELECT tagid FROM thread_tags WHERE tid = $1", [tid]);
  await c.query("DELETE FROM thread_tags WHERE tid = $1", [tid]);
  for (const r of oldRows.rows) {
    await c.query("UPDATE tags SET threads = threads - 1 WHERE tagid = $1", [r.tagid]);
  }
  await c.query("DELETE FROM tags WHERE threads <= 0");

  const tagList = tags
    .split(/[,\s，]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 5);
  for (const tag of tagList) {
    const r = await c.query<{ tagid: number }>(
      "INSERT INTO tags (tagname, threads) VALUES ($1, 1) ON CONFLICT (tagname) DO UPDATE SET threads = tags.threads + 1 RETURNING tagid",
      [tag]
    );
    if (r.rows[0]) {
      await c.query<{ tagid: number }>("INSERT INTO thread_tags (tid, tagid) VALUES ($1, $2) ON CONFLICT DO NOTHING", [
        tid,
        r.rows[0].tagid,
      ]);
    }
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录", 401);

  const { id: idStr } = await ctx.params;
  const pid = Number(idStr);
  if (!Number.isInteger(pid) || pid <= 0) return fail("帖子参数错误");

  const post = await queryOne<{
    id: number;
    tid: number;
    articletitle: string;
    articlecontent: string;
    usrid: number;
    username: string;
    posttrash: number;
  }>("SELECT id, tid, articletitle, articlecontent, usrid, username, posttrash FROM posts WHERE id = $1", [pid]);
  if (!post || post.posttrash === 1) return fail("目标帖子不存在");

  const canEdit = post.usrid === auth.user.userid || auth.isMod;
  if (!canEdit) return fail("您没有权限编辑此帖子", 403);

  const thread = await queryOne<{ tid: number; title: string; newdesc: string; ttagname: string; authorid: number; islock: number }>(
    "SELECT tid, title, newdesc, ttagname, authorid, islock FROM threads WHERE tid = $1",
    [post.tid]
  );
  if (!thread) return fail("所属主题不存在");

  const firstPost = await queryOne<{ id: number }>("SELECT id FROM posts WHERE tid = $1 ORDER BY id LIMIT 1", [post.tid]);
  const isFirstPost = firstPost?.id === post.id;

  return ok({
    post: { id: post.id, tid: post.tid, articletitle: post.articletitle, articlecontent: post.articlecontent, username: post.username },
    thread: { tid: thread.tid, title: thread.title, newdesc: thread.newdesc, ttagname: thread.ttagname },
    isFirstPost,
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录", 401);

  const { id: idStr } = await ctx.params;
  const pid = Number(idStr);
  if (!Number.isInteger(pid) || pid <= 0) return fail("帖子参数错误");

  const body = await readBody(req);
  const content = await applyWordFilter(str(body, "content", 60000));
  if (!content) return fail("请填写帖子内容");

  const post = await queryOne<{ id: number; tid: number; usrid: number; forumid: number; posttrash: number }>(
    "SELECT id, tid, usrid, forumid, posttrash FROM posts WHERE id = $1",
    [pid]
  );
  if (!post || post.posttrash === 1) return fail("目标帖子不存在");

  const thread = await queryOne<{ tid: number; title: string; authorid: number; islock: number }>(
    "SELECT tid, title, authorid, islock FROM threads WHERE tid = $1",
    [post.tid]
  );
  if (!thread) return fail("所属主题不存在");
  if (thread.islock === 1 && !auth.isMod) return fail("主题已锁定，无法编辑");

  const isAuthor = post.usrid === auth.user.userid;
  const canEdit = isAuthor || auth.isMod;
  if (!canEdit) return fail("您没有权限编辑此帖子", 403);

  const firstPost = await queryOne<{ id: number }>("SELECT id FROM posts WHERE tid = $1 ORDER BY id LIMIT 1", [post.tid]);
  const isFirstPost = firstPost?.id === post.id;

  // 首帖才允许改标题/简介/标签（复刻原版：仅 modify 首帖时呈现这些字段）
  const newTitle = isFirstPost ? await applyWordFilter(str(body, "title", 200)) : "";
  const newdesc = isFirstPost ? await applyWordFilter(str(body, "newdesc", 240)) : "";
  const tags = isFirstPost ? await applyWordFilter(str(body, "tags", 200)) : "";

  if (isFirstPost && !newTitle) return fail("请填写主题标题");

  const now = Math.floor(Date.now() / 1000);
  await transaction(async (c) => {
    await c.query("UPDATE posts SET articlecontent = $1, changtime = $2, editinfo = $3 WHERE id = $4", [
      content,
      now,
      `${now}|${auth.user!.username}`,
      post.id,
    ]);
    if (isFirstPost) {
      await c.query("UPDATE threads SET title = $1, newdesc = $2, ttagname = $3, changetime = $4 WHERE tid = $5", [
        newTitle,
        newdesc,
        tags,
        now,
        post.tid,
      ]);
      await syncTags(c, post.tid, tags);
    } else {
      await c.query("UPDATE threads SET changetime = $1 WHERE tid = $2", [now, post.tid]);
    }
    await c.query(
      "INSERT INTO forumlog (fid, time, operator, action, detail) VALUES ($1, $2, $3, $4, $5)",
      [post.forumid, now, auth.user!.username, "编辑帖子", `${thread.title}（#${post.id}）`]
    );
  });

  return ok({ tid: post.tid, message: "编辑成功" });
}
