import { NextRequest } from "next/server";
import { queryOne, execute, transaction } from "@/lib/db";
import { str, num, readBody, ok, fail, POST_INTERVAL } from "@/lib/api";
import { getAuth } from "@/lib/auth";

/** POST /api/threads —— 发布新主题（含投票与标签） */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录后再发布主题");
  const body = await readBody(req);
  const forumid = num(body, "forumid");
  const title = str(body, "title", 200);
  const content = str(body, "content", 60000);
  const tags = str(body, "tags", 200);
  const toptype = num(body, "toptype") || 0;
  const pollOptions = Array.isArray(body.pollOptions)
    ? (body.pollOptions as unknown[])
        .map((o) => String(o).trim().slice(0, 100))
        .filter(Boolean)
        .slice(0, 20)
    : [];

  if (!Number.isInteger(forumid) || forumid <= 0) return fail("版块参数错误");
  if (!title) return fail("请填写标题");
  if (!content) return fail("请填写内容");

  const forum = await queryOne<{ type: string }>("SELECT type FROM forumdata WHERE id = $1", [forumid]);
  if (!forum || forum.type !== "forum") return fail("目标版块不存在");

  // 发帖频率限制
  const now = Math.floor(Date.now() / 1000);
  const last = auth.user.lastpost || 0;
  if (now - last < POST_INTERVAL && !auth.isAdmin) {
    return fail(`发布间隔太短，请 ${POST_INTERVAL - (now - last)} 秒后再试`);
  }

  const tid = await transaction(async (c) => {
    const t = await c.query<{ tid: number }>(
      `INSERT INTO threads (forumid, toptype, title, content, author, authorid, time, changetime, hits, replys, lastreply, ttagname)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, 1, 0, $5, $8) RETURNING tid`,
      [forumid, toptype, title, content, auth.user!.username, auth.user!.userid, now, tags]
    );
    const newTid = t.rows[0].tid;
    await c.query(
      `INSERT INTO posts (tid, articletitle, username, usrid, articlecontent, timestamp, forumid, changtime)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $6)`,
      [newTid, title, auth.user!.username, auth.user!.userid, content, now, forumid]
    );
    if (pollOptions.length >= 2) {
      await c.query(`INSERT INTO polls (tid, options, polluser, maxchoose) VALUES ($1, $2::jsonb, '[]'::jsonb, 1)`, [
        newTid,
        JSON.stringify(pollOptions.map((text) => ({ text, votes: 0 }))),
      ]);
    }
    await c.query(
      `UPDATE forumdata SET topicnum = topicnum + 1, todayp = todayp + 1,
              fltitle = $2, flposter = $3, flposttime = $4 WHERE id = $1`,
      [forumid, title, auth.user!.username, now]
    );
    await c.query("UPDATE userlist SET postamount = postamount + 1, lastpost = $2 WHERE userid = $1", [
      auth.user!.userid,
      now,
    ]);
    await c.query("UPDATE lastest SET threadnum = threadnum + 1, todaynew = todaynew + 1, postsnum = postsnum + 1");
    // 标签
    if (tags) {
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
          await c.query("INSERT INTO thread_tags (tid, tagid) VALUES ($1, $2) ON CONFLICT DO NOTHING", [
            newTid,
            r.rows[0].tagid,
          ]);
        }
      }
    }
    return newTid;
  });

  return ok({ tid });
}
