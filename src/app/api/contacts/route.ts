import { NextRequest } from "next/server";
import { query, queryOne, execute } from "@/lib/db";
import { str, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";

/** GET /api/contacts —— 我的好友列表 */
export async function GET() {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");
  const rows = await query<{ username: string; userid: number | null; postamount: number | null }>(
    `SELECT COALESCE(u.username, '(已注销)') AS username, u.userid, u.postamount
     FROM contacts c LEFT JOIN userlist u ON u.userid = c.contacts
     WHERE c.owner = $1 ORDER BY c.contacts`,
    [auth.user.userid]
  );
  return ok({ list: rows });
}

/** POST /api/contacts —— 添加好友 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");

  const body = await readBody(req);
  const username = str(body, "username", 30);
  if (!username) return fail("请填写用户名");
  if (username === auth.user.username) return fail("不能添加自己为好友");

  const target = await queryOne<{ username: string; userid: number }>(
    "SELECT username, userid FROM userlist WHERE lower(username) = lower($1)",
    [username]
  );
  if (!target) return fail("该用户不存在");

  const exists = await queryOne<{ owner: number }>(
    "SELECT owner FROM contacts WHERE owner = $1 AND contacts = $2",
    [auth.user.userid, target.userid]
  );
  if (exists) return fail("该用户已在您的好友列表中");

  const cnt = await queryOne<{ c: string }>(
    "SELECT count(*) AS c FROM contacts WHERE owner = $1",
    [auth.user.userid]
  );
  if (cnt && Number(cnt.c) >= 50) return fail("好友数量已达上限（50）");

  await execute("INSERT INTO contacts (owner, contacts, conname, adddate) VALUES ($1, $2, $3, $4)", [
    auth.user.userid,
    target.userid,
    target.username,
    Math.floor(Date.now() / 1000),
  ]);
  return ok();
}

/** DELETE /api/contacts —— 删除好友 */
export async function DELETE(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");
  const body = await readBody(req);
  const username = str(body, "username", 30);
  if (!username) return fail("参数错误");
  const target = await queryOne<{ userid: number }>(
    "SELECT userid FROM userlist WHERE lower(username) = lower($1)",
    [username]
  );
  if (!target) return fail("该用户不存在");
  await execute("DELETE FROM contacts WHERE owner = $1 AND contacts = $2", [
    auth.user.userid,
    target.userid,
  ]);
  return ok();
}
