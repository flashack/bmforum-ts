import { NextRequest } from "next/server";
import { execute } from "@/lib/db";
import { str, num, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { logAdminAction } from "@/lib/moderation";

/** POST /api/admin/words —— 敏感词管理 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);

  const body = await readBody(req);
  const action = str(body, "action", 10);

  if (action === "add") {
    const find = str(body, "find", 100);
    const replacewith = str(body, "replacewith", 100) || "**";
    if (!find) return fail("请填写需要过滤的词语");
    await execute("INSERT INTO wordfilter (find, replacewith) VALUES ($1, $2)", [find, replacewith]);
    await logAdminAction(auth.user.username, "addword", `新增敏感词 ${find}`);
    return ok();
  }

  if (action === "delete") {
    const id = num(body, "id");
    if (!Number.isInteger(id)) return fail("参数错误");
    await execute("DELETE FROM wordfilter WHERE id = $1", [id]);
    await logAdminAction(auth.user.username, "delword", `删除敏感词 id=${id}`);
    return ok();
  }

  return fail("未知操作");
}
