import { NextRequest } from "next/server";
import { query, execute } from "@/lib/db";
import { num, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { logAdminAction } from "@/lib/moderation";

const PERMS = ["canview", "canpost", "canreply", "canupload", "canvote", "canpm", "candigg", "cansearch"] as const;

/** GET /api/admin/groups —— 用户组与权限列表 */
export async function GET() {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);
  const rows = await query<Record<string, number | string>>(
    `SELECT id, groupname, groupicon, showsort, canview, canpost, canreply, canupload,
            canvote, canpm, candigg, cansearch FROM usergroup ORDER BY id`
  );
  return ok({ list: rows });
}

/** POST /api/admin/groups —— 保存用户组权限 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);

  const body = await readBody(req);
  const id = num(body, "id");
  if (![0, 1, 2, 3, 4].includes(id)) return fail("用户组参数错误");

  const sets: string[] = [];
  const vals: (number | string)[] = [id];
  PERMS.forEach((p, i) => {
    sets.push(`${p} = $${i + 2}`);
    vals.push(num(body, p) ? 1 : 0);
  });
  await execute(`UPDATE usergroup SET ${sets.join(", ")} WHERE id = $1`, vals);
  await logAdminAction(auth.user.username, "setperms", `调整用户组 ${id} 权限`);
  return ok();
}
