import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { queryOne, execute, transaction } from "@/lib/db";
import { str, readBody, ok, fail } from "@/lib/api";
import { hashPassword, createSession } from "@/lib/auth";

/** POST /api/auth/register —— 注册 */
export async function POST(req: NextRequest) {
  const body = await readBody(req);
  const username = str(body, "username", 30);
  const password = str(body, "password", 100);
  const mailadd = str(body, "mailadd", 100);

  if (!username || !password) return fail("用户名和密码不能为空");
  if (!/^[\u4e00-\u9fa5A-Za-z0-9_]{2,30}$/.test(username)) {
    return fail("用户名只能包含中文、字母、数字和下划线，长度 2-30");
  }
  if (password.length < 6) return fail("密码长度至少 6 位");
  if (mailadd && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailadd)) return fail("邮箱格式不正确");

  const exists = await queryOne<{ username: string }>(
    "SELECT username FROM userlist WHERE lower(username) = lower($1)",
    [username]
  );
  if (exists) return fail("该用户名已被注册");

  const salt = randomBytes(8).toString("hex");
  const pwd = hashPassword(password, salt);
  const now = Math.floor(Date.now() / 1000);
  const regdate = new Date().toISOString().slice(0, 10);

  await transaction(async (c) => {
    await c.query(
      `INSERT INTO userlist (username, pwd, salt, mailadd, regdate, lastlogin, postamount, point, money,
                             usergroup, headtitle, desper, avatar, online_status, lastpost)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 100, 1, '注册用户', '新手上路', '', 'offline', 0)`,
      [username, pwd, salt, mailadd, regdate, now]
    );
    await c.query("UPDATE lastest SET regednum = regednum + 1");
  });

  const created = await queryOne<{ userid: number }>("SELECT userid FROM userlist WHERE username = $1", [username]);
  if (!created) return fail("注册失败，请重试", 500);
  await createSession(created.userid);
  return ok({ username });
}
