import { NextRequest } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { str, readBody, ok, fail } from "@/lib/api";
import { verifyPassword, createSession, clientIp } from "@/lib/auth";
import { isIpBanned } from "@/lib/moderation";

/** POST /api/auth/login —— 登录 */
export async function POST(req: NextRequest) {
  const ip = await clientIp();
  if (await isIpBanned(ip)) return fail("您的 IP 已被禁止登录", 403);

  const body = await readBody(req);
  const username = str(body, "username", 30);
  const password = str(body, "password", 100);
  if (!username || !password) return fail("请输入用户名和密码");

  const user = await queryOne<{
    userid: number;
    username: string;
    pwd: string;
    salt: string;
  }>("SELECT userid, username, pwd, salt FROM userlist WHERE lower(username) = lower($1)", [username]);
  if (!user || !verifyPassword(password, user.salt, user.pwd)) {
    return fail("用户名或密码错误");
  }

  const now = Math.floor(Date.now() / 1000);
  await execute("UPDATE userlist SET lastlogin = $2 WHERE userid = $1", [user.userid, now]);
  await createSession(user.userid);
  return ok({ username: user.username });
}
