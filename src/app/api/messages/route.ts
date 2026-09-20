import { NextRequest } from "next/server";
import { query, queryOne, execute } from "@/lib/db";
import { num, readBody, str, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { applyWordFilter } from "@/lib/moderation";

/** POST /api/messages —— 发送短消息 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录后再发送消息");
  if (!auth.user.canpm) return fail("您所在的用户组无权发送短消息", 403);
  const body = await readBody(req);
  const sendto = str(body, "sendto", 30);
  const prtitle = await applyWordFilter(str(body, "title", 100));
  const prcontent = await applyWordFilter(str(body, "content", 20000));
  if (!sendto || !prtitle || !prcontent) return fail("收件人、标题和内容均不能为空");

  const target = await queryOne<{ username: string }>(
    "SELECT username FROM userlist WHERE lower(username) = lower($1)",
    [sendto]
  );
  if (!target) return fail("收件人不存在");
  if (target.username === auth.user.username) return fail("不能给自己发送短消息");

  const now = Math.floor(Date.now() / 1000);
  // 原版 primsg 语义：belong = 信箱归属者，prtype r=收件 s=发件副本
  await execute(
    `INSERT INTO primsg (belong, sender, sendto, prtitle, prtime, prcontent, prread, prtype)
     VALUES ($1, $2, $1, $3, $4, $5, 0, 'r'), ($2, $2, $1, $3, $4, $5, 0, 's')`,
    [target.username, auth.user.username, prtitle, now, prcontent]
  );
  return ok();
}

/** GET /api/messages —— 收件箱列表 */
export async function GET() {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");
  const list = await query(
    `SELECT id, sender, sendto, prtitle, prtime, prread, prtype
     FROM primsg WHERE belong = $1 AND prtype = 'r' ORDER BY prtime DESC LIMIT 50`,
    [auth.user.username]
  );
  return ok({ list });
}

/** DELETE /api/messages —— 删除短消息（复刻原版 mess.php del 动作，收发两个副本一并删除） */
export async function DELETE(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return fail("消息参数错误");

  const msg = await queryOne<{ id: number; belong: string; sender: string; sendto: string; prtime: number; prtype: string }>(
    "SELECT id, belong, sender, sendto, prtime, prtype FROM primsg WHERE id = $1",
    [id]
  );
  if (!msg) return fail("消息不存在");
  // 只能删除自己信箱里的消息（收件或发件副本）
  const own = (msg.prtype === "r" && msg.belong === auth.user.username) || (msg.prtype === "s" && msg.belong === auth.user.username);
  if (!own) return fail("您没有权限删除此消息", 403);

  // 同一封邮件的收发两个副本一起删（与原版行为一致）
  await execute(
    "DELETE FROM primsg WHERE ((belong = $1 AND prtype = 's') OR (belong = $2 AND prtype = 'r' AND sender = $1 AND sendto = $2 AND prtime = $3))",
    [auth.user.username, msg.prtype === "r" ? msg.sender : msg.sendto, msg.prtime]
  );
  // 兜底：确保至少当前这条被删除
  await execute("DELETE FROM primsg WHERE id = $1 AND belong = $2", [id, auth.user.username]);
  return ok({ message: "消息已删除" });
}
