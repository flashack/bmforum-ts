import { NextRequest } from "next/server";
import { query, queryOne, execute } from "@/lib/db";
import { str, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { logAdminAction } from "@/lib/moderation";

/** POST /api/admin/banname —— 添加/移除禁止注册名单（原版 include/admin/banname.php） */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);

  const body = await readBody(req);
  const action = str(body, "action", 10) || "add";
  const name = str(body, "name", 60);
  if (!name) return fail("请填写要禁止的用户名");
  if (!/^[\u4e00-\u9fa5A-Za-z0-9_]{1,60}$/.test(name)) return fail("用户名只能包含中文、字母、数字和下划线");

  if (action === "delete") {
    const exists = await queryOne("SELECT name FROM banname WHERE name = $1", [name]);
    if (!exists) return fail("该用户名不在禁止名单中");
    await execute("DELETE FROM banname WHERE name = $1", [name]);
    await logAdminAction(auth.user.username, "banname", `移除禁注名单：${name}`);
    return ok({ message: `已移除禁注：${name}` });
  }

  const exists = await queryOne("SELECT name FROM banname WHERE lower(name) = lower($1)", [name]);
  if (exists) return fail("该用户名已在禁止名单中");

  await execute("INSERT INTO banname (name) VALUES ($1)", [name]);
  await logAdminAction(auth.user.username, "banname", `添加禁注名单：${name}`);
  return ok({ message: `已禁止注册：${name}` });
}

/** DELETE /api/admin/banname —— 移除禁止注册名单 */
export async function DELETE(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);

  const name = new URL(req.url).searchParams.get("name") ?? "";
  if (!name) return fail("参数错误");
  const exists = await queryOne("SELECT name FROM banname WHERE name = $1", [name]);
  if (!exists) return fail("该用户名不在禁止名单中");

  await execute("DELETE FROM banname WHERE name = $1", [name]);
  await logAdminAction(auth.user.username, "banname", `移除禁注名单：${name}`);
  const rest = await query<{ name: string }>("SELECT name FROM banname ORDER BY name");
  return ok({ message: "已移除", list: rest });
}
