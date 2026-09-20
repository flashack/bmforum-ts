import { NextRequest } from "next/server";
import { queryOne, execute, transaction } from "@/lib/db";
import { str, num, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { logAdminAction } from "@/lib/moderation";

/** POST /api/admin/users —— 用户管理 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);

  const body = await readBody(req);
  const action = str(body, "action", 10);
  const username = str(body, "username", 30);
  if (!username) return fail("参数错误");

  const target = await queryOne<{ userid: number; username: string; usergroup: number }>(
    "SELECT userid, username, usergroup FROM userlist WHERE username = $1",
    [username]
  );
  if (!target) return fail("用户不存在");
  if (target.usergroup === 3 && target.username !== auth.user.username) {
    return fail("不能对其他管理员执行此操作");
  }

  if (action === "setgroup") {
    const group = num(body, "group");
    if (![0, 1, 2, 3, 4].includes(group)) return fail("用户组参数错误");
    if (group === 3 && target.usergroup !== 3) return fail("不能将用户提升为管理员");
    await execute("UPDATE userlist SET usergroup = $2 WHERE userid = $1", [target.userid, group]);
    await logAdminAction(auth.user.username, "setgroup", `${username} → 用户组 ${group}`);
    return ok();
  }

  if (action === "ban") {
    await execute("UPDATE userlist SET usergroup = 4 WHERE userid = $1", [target.userid]);
    await execute("DELETE FROM sessions WHERE userid = $1", [target.userid]);
    await logAdminAction(auth.user.username, "ban", `封禁用户 ${username}`);
    return ok();
  }

  if (action === "unban") {
    await execute("UPDATE userlist SET usergroup = 1 WHERE userid = $1 AND usergroup = 4", [target.userid]);
    await logAdminAction(auth.user.username, "unban", `解封用户 ${username}`);
    return ok();
  }

  if (action === "editsig") {
    const signtext = str(body, "signtext", 500);
    const headtitle = str(body, "headtitle", 40);
    await execute("UPDATE userlist SET signtext = $2, headtitle = $3 WHERE userid = $1", [
      target.userid,
      signtext,
      headtitle,
    ]);
    await logAdminAction(auth.user.username, "edituser", `编辑用户 ${username} 的签名/头衔`);
    return ok();
  }

  if (action === "delete") {
    if (target.username === auth.user.username) return fail("不能删除自己");
    await transaction(async (c) => {
      await c.query("DELETE FROM userlist WHERE userid = $1", [target.userid]);
      await c.query("DELETE FROM sessions WHERE userid = $1", [target.userid]);
      await c.query("DELETE FROM favorites WHERE owner = $1", [target.userid]);
      await c.query("DELETE FROM contacts WHERE owner = $1", [target.userid]);
      await c.query("DELETE FROM primsg WHERE belong = $1", [target.username]);
    });
    await execute("UPDATE lastest SET regednum = GREATEST(regednum - 1, 0)");
    await logAdminAction(auth.user.username, "deleteuser", `删除用户 ${username}`);
    return ok();
  }

  return fail("未知操作");
}
