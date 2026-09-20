import { NextRequest } from "next/server";
import { query, queryOne, execute } from "@/lib/db";
import { num, readBody, str, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";

/** POST /api/messages —— 发送短消息 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录后再发送消息");
  const body = await readBody(req);
  const sendto = str(body, "sendto", 30);
  const prtitle = str(body, "title", 100);
  const prcontent = str(body, "content", 20000);
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
