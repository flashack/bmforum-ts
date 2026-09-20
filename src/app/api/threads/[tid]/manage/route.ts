import { NextRequest } from "next/server";
import { queryOne, execute, transaction } from "@/lib/db";
import { str, num, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { logForumAction } from "@/lib/moderation";

/**
 * POST /api/threads/[tid]/manage —— 版主/管理员/楼主操作
 * 原版 manage.php：lock/unlock/jihua(加精)/unjihua/move/copy/del + manage2 btfront(提前) + 置顶分级
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tid: string }> }
) {
  const { tid: tidStr } = await params;
  const tid = Number(tidStr);
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");

  const body = await readBody(req);
  const action = str(body, "action", 10);
  const thread = await queryOne<{ forumid: number; title: string; author: string; authorid: number; replys: number; toptype: number }>(
    "SELECT forumid, title, author, authorid, replys, toptype FROM threads WHERE tid = $1",
    [tid]
  );
  if (!thread) return fail("主题不存在");

  const now = Math.floor(Date.now() / 1000);
  const isStarter = auth.user.userid === thread.authorid;
  // 权限闸门：版主全部可操作；楼主仅可删除自己 0 回复的主题（原版 del_self_topic）
  const modOnly = action !== "delete";
  if (modOnly && !auth.isMod) return fail("权限不足");
  if (action === "delete" && !auth.isMod && !(isStarter && thread.replys === 0)) return fail("权限不足");

  switch (action) {
    case "sticky": {
      // 置顶分级：0 无 → 1 本版 → 2 分类 → 3 全局 → 0（原版 toptype/holdfront）
      const level = num(body, "level");
      if (![0, 1, 2, 3].includes(level)) return fail("置顶级别参数错误");
      if (level !== 0 && !auth.isMod) return fail("权限不足");
      await execute("UPDATE threads SET toptype = $2 WHERE tid = $1", [tid, level]);
      return ok({ toptype: level });
    }
    case "digest": {
      // 加精（原版 jihua）：threads.digest 切换 + 作者 digestmount + 版块 digestcount 联动
      const cur = await queryOne<{ digest: number }>("SELECT digest FROM threads WHERE tid = $1", [tid]);
      if (!cur) return fail("主题不存在");
      const next = cur.digest ? 0 : 1;
      await transaction(async (c) => {
        await c.query("UPDATE threads SET digest = $2 WHERE tid = $1", [tid, next]);
        if (next) {
          await c.query("UPDATE userlist SET digestmount = digestmount + 1 WHERE username = $1", [thread.author]);
          await c.query("UPDATE forumdata SET digestcount = digestcount + 1 WHERE id = $1", [thread.forumid]);
        } else {
          await c.query("UPDATE userlist SET digestmount = GREATEST(digestmount - 1, 0) WHERE username = $1", [thread.author]);
          await c.query("UPDATE forumdata SET digestcount = GREATEST(digestcount - 1, 0) WHERE id = $1", [thread.forumid]);
        }
      });
      await logForumAction(thread.forumid, auth.user.username, next ? "digest" : "undigest", `加精/取消加精：${thread.title}`);
      return ok({ digest: next });
    }
    case "lock":
      await execute("UPDATE threads SET islock = CASE WHEN islock = 1 THEN 0 ELSE 1 END WHERE tid = $1", [tid]);
      return ok();
    case "front": {
      // 提前主题（原版 manage2 btfront）：刷新排序时间
      await execute("UPDATE threads SET changetime = $2 WHERE tid = $1", [tid, now]);
      return ok();
    }
    case "move": {
      const to = num(body, "forumid");
      const target = await queryOne<{ id: number }>("SELECT id FROM forumdata WHERE id = $1 AND type = 'forum'", [to]);
      if (!Number.isInteger(to) || !target) return fail("目标版块不存在");
      if (to === thread.forumid) return fail("不能移动到原版块");
      await transaction(async (c) => {
        await c.query("UPDATE threads SET forumid = $2 WHERE tid = $1", [tid, to]);
        await c.query("UPDATE posts SET forumid = $2 WHERE tid = $1", [tid, to]);
        await c.query("UPDATE forumdata SET topicnum = topicnum - 1 WHERE id = $1", [thread.forumid]);
        await c.query("UPDATE forumdata SET topicnum = topicnum + 1 WHERE id = $1", [to]);
      });
      await logForumAction(to, auth.user.username, "move", `移动主题「${thread.title}」`);
      return ok();
    }
    case "copy": {
      // 复制主题（原版 manage copy）：主题+首帖复制到目标版块
      const to = num(body, "forumid");
      const target = await queryOne<{ id: number }>("SELECT id FROM forumdata WHERE id = $1 AND type = 'forum'", [to]);
      if (!Number.isInteger(to) || !target) return fail("目标版块不存在");
      const first = await queryOne<{ articletitle: string; articlecontent: string }>(
        "SELECT articletitle, articlecontent FROM posts WHERE tid = $1 ORDER BY id LIMIT 1",
        [tid]
      );
      await transaction(async (c) => {
        const t = await c.query<{ tid: number }>(
          `INSERT INTO threads (forumid, toptype, title, content, author, authorid, time, changetime, hits, replys, lastreply, ttagname, newdesc, type)
           SELECT $2, 0, title, content, author, authorid, time, $3, 0, 0, author, ttagname, newdesc, type FROM threads WHERE tid = $1 RETURNING tid`,
          [tid, to, now]
        );
        const newTid = t.rows[0].tid;
        if (first) {
          await c.query(
            `INSERT INTO posts (tid, articletitle, username, usrid, articlecontent, timestamp, forumid, changtime)
             VALUES ($1, $2, $3, (SELECT userid FROM userlist WHERE username = $3 LIMIT 1), $4, $5, $6, $5)`,
            [newTid, first.articletitle, thread.author, first.articlecontent, now, to]
          );
        }
        await c.query("UPDATE forumdata SET topicnum = topicnum + 1 WHERE id = $1", [to]);
        await c.query("UPDATE lastest SET threadnum = threadnum + 1, postsnum = postsnum + 1");
      });
      return ok();
    }
    case "trash":
      await transaction(async (c) => {
        await c.query("UPDATE threads SET ttrash = 1 WHERE tid = $1", [tid]);
        await c.query("UPDATE forumdata SET topicnum = GREATEST(topicnum - 1, 0) WHERE id = $1", [thread.forumid]);
        await c.query("UPDATE lastest SET threadnum = GREATEST(threadnum - 1, 0)");
      });
      await logForumAction(thread.forumid, auth.user.username, "trash", `主题进回收站：${thread.title}`);
      return ok({ trashed: true });
    case "delete": {
      // 楼主可删除自己 0 回复的主题（原版 del_self_topic），其余需版主
      if (!auth.isMod && !(isStarter && thread.replys === 0)) return fail("权限不足");
      await transaction(async (c) => {
        const t = await c.query<{ replys: number }>("SELECT replys FROM threads WHERE tid = $1", [tid]);
        await c.query("DELETE FROM posts WHERE tid = $1", [tid]);
        await c.query("DELETE FROM threads WHERE tid = $1", [tid]);
        await c.query("DELETE FROM favorites WHERE tid = $1", [tid]);
        await c.query("DELETE FROM polls WHERE tid = $1", [tid]);
        await c.query("DELETE FROM beg WHERE tid = $1", [tid]);
        await c.query("UPDATE forumdata SET topicnum = topicnum - 1 WHERE id = $1", [thread.forumid]);
        await c.query("UPDATE lastest SET postsnum = postsnum - $1::int", [t.rows[0] ? t.rows[0].replys + 1 : 1]);
        await c.query("UPDATE lastest SET threadnum = GREATEST(threadnum - 1, 0)");
        // 原版 del：删除主题扣除作者 1 积分（发帖数）
        await c.query("UPDATE userlist SET postamount = GREATEST(postamount - 1, 0) WHERE userid = $1", [thread.authorid]);
      });
      return ok({ deleted: true });
    }
    default:
      return fail("未知操作");
  }
}
