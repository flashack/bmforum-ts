import { NextRequest } from "next/server";
import { queryOne, execute, query } from "@/lib/db";
import { str, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";

/**
 * POST /api/report —— 举报帖子/主题（复刻原版 report.php）
 * 向该版块版主与全体管理员发送短消息报告
 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录后再举报", 401);

  const body = await readBody(req);
  const pid = Number(body.pid);
  const reason = str(body, "reason", 500);
  if (!Number.isInteger(pid) || pid <= 0) return fail("帖子参数错误");
  if (!reason) return fail("请填写举报理由");

  const post = await queryOne<{ id: number; tid: number; articletitle: string; posttrash: number }>(
    "SELECT id, tid, articletitle, posttrash FROM posts WHERE id = $1",
    [pid]
  );
  if (!post || post.posttrash === 1) return fail("目标帖子不存在");

  const thread = await queryOne<{ tid: number; title: string; forumid: number; ttrash: number }>(
    "SELECT tid, title, forumid, ttrash FROM threads WHERE tid = $1",
    [post.tid]
  );
  if (!thread || thread.ttrash === 1) return fail("所属主题不存在");

  // 收件人：本版版主 + 全体管理员（排除自己）
  const forum = await queryOne<{ blad: string }>("SELECT blad FROM forumdata WHERE id = $1", [thread.forumid]);
  const modNames = (forum?.blad ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const admins = await query<{ username: string }>("SELECT username FROM userlist WHERE usergroup = 3");
  const receivers = [...new Set([...modNames, ...admins.map((a) => a.username)])].filter(
    (n) => n && n !== auth.user!.username
  );
  if (receivers.length === 0) return fail("当前没有可接收举报的版主或管理员");

  const now = Math.floor(Date.now() / 1000);
  const title = `帖子问题报告：${thread.title}`;
  const content =
    `${auth.user.username} 刚刚报告了一个有问题的主题\n` +
    `该帖子的地址是：/topic/${thread.tid}#${post.id}\n` +
    `该帖子的名称是：${post.articletitle || thread.title}\n` +
    `报告者的陈述是：\n${reason}`;

  await execute("BEGIN");
  try {
    for (const name of receivers) {
      // 原版 primsg：belong=收件箱归属，prtype='r'
      await execute(
        "INSERT INTO primsg (belong, sender, sendto, prtitle, prcontent, prtime, prread, prtype) VALUES ($1, $2, $3, $4, $5, $6, 0, 'r')",
        [name, auth.user!.username, name, title, content, now]
      );
    }
    await execute(
      "INSERT INTO forumlog (fid, time, operator, action, detail) VALUES ($1, $2, $3, $4, $5)",
      [thread.forumid, now, auth.user!.username, "举报帖子", `${thread.title}（#${post.id}）：${reason.slice(0, 80)}`]
    );
    await execute("COMMIT");
  } catch {
    await execute("ROLLBACK");
    return fail("举报发送失败，请稍后再试");
  }

  return ok({ message: "举报已提交，版主将会收到通知" });
}
