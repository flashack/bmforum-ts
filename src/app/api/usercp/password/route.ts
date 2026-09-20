import { NextRequest } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { str, readBody, ok, fail } from "@/lib/api";
import { getAuth, hashPassword, verifyPassword } from "@/lib/auth";

/** POST /api/usercp/password —— 修改密码 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");

  const body = await readBody(req);
  const oldpwd = str(body, "oldpwd", 100);
  const newpwd = str(body, "newpwd", 100);
  if (!oldpwd || !newpwd) return fail("请填写原密码和新密码");
  if (newpwd.length < 6) return fail("新密码长度至少 6 位");

  const row = await queryOne<{ pwd: string; salt: string }>(
    "SELECT pwd, salt FROM userlist WHERE userid = $1",
    [auth.user.userid]
  );
  if (!row || !verifyPassword(oldpwd, row.salt, row.pwd)) return fail("原密码错误");

  const salt = row.salt;
  await execute("UPDATE userlist SET pwd = $2 WHERE userid = $1", [
    auth.user.userid,
    hashPassword(newpwd, salt),
  ]);
  return ok();
}
