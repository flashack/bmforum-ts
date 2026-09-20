import { NextRequest } from "next/server";
import { queryOne, execute, transaction } from "@/lib/db";
import { str, readBody, ok, fail, POST_INTERVAL } from "@/lib/api";
import { getAuth, clientIp } from "@/lib/auth";
import { applyWordFilter, isIpBanned, sendNotification } from "@/lib/moderation";

/** POST /api/threads/[tid]/reply —— 回复主题 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tid: string }> }
) {
  const { tid: tidStr } = await params;
  const tid = Number(tidStr);
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录后再回复");
  if (!auth.user.canreply) return fail("您所在的用户组无权回复", 403);
  if (await isIpBanned(await clientIp())) return fail("您的 IP 已被封禁", 403);
  if (!Number.isInteger(tid)) return fail("主题参数错误");

  const thread = await queryOne<{ title: string; forumid: number; islock: number; authorid: number }>(
    "SELECT title, forumid, islock, authorid FROM threads WHERE tid = $1",
    [tid]
  );
  if (!thread) return fail("主题不存在");
  if (thread.islock === 1 && !auth.isMod) return fail("主题已锁定，无法回复");

  const body = await readBody(req);
  const content = await applyWordFilter(str(body, "content", 60000));
  if (!content) return fail("请填写回复内容");

  const now = Math.floor(Date.now() / 1000);
  const last = auth.user.lastpost || 0;
  if (now - last < POST_INTERVAL && !auth.isAdmin) {
    return fail(`回复间隔太短，请 ${POST_INTERVAL - (now - last)} 秒后再试`);
  }

  await transaction(async (c) => {
    const rip = await clientIp();
    await c.query(
      `INSERT INTO posts (tid, articletitle, username, usrid, articlecontent, timestamp, forumid, changtime, ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $6, $8)`,
      [tid, thread.title, auth.user!.username, auth.user!.userid, content, now, thread.forumid, rip]
    );
    await c.query(
      `UPDATE threads SET replys = replys + 1, lastreply = $3, changetime = $2 WHERE tid = $1`,
      [tid, now, auth.user!.username]
    );
    await c.query(
      `UPDATE forumdata SET replysnum = replysnum + 1, todayp = todayp + 1,
              fltitle = $2, flposter = $3, flposttime = $4 WHERE id = $1`,
      [thread.forumid, thread.title, auth.user!.username, now]
    );
    await c.query("UPDATE userlist SET postamount = postamount + 1, lastpost = $2 WHERE userid = $1", [
      auth.user!.userid,
      now,
    ]);
    await c.query("UPDATE lastest SET postsnum = postsnum + 1, todaynew = todaynew + 1");
  });

  // 通知主题作者
  await sendNotification(
    auth.user.userid,
    auth.user.username,
    thread.authorid,
    "reply",
    `回复了您的主题「${thread.title}」`,
    tid
  );

  return ok();
}
