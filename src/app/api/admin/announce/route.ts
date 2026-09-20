import { NextRequest } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { str, num, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { applyWordFilter, logAdminAction } from "@/lib/moderation";

/** POST /api/admin/announce —— 后台：发布公告/删除公告 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);

  const body = await readBody(req);
  const action = str(body, "action", 10) || "create";

  if (action === "delete") {
    const id = num(body, "id");
    if (!Number.isInteger(id)) return fail("参数错误");
    await execute("DELETE FROM announces WHERE id = $1", [id]);
    await logAdminAction(auth.user.username, "delannounce", `删除公告 id=${id}`);
    return ok();
  }

  const title = await applyWordFilter(str(body, "title", 200));
  const content = await applyWordFilter(str(body, "content", 20000));
  if (!title || !content) return fail("标题和内容不能为空");

  await execute(
    "INSERT INTO announces (title, content, author, addtime) VALUES ($1, $2, $3, $4)",
    [title, content, auth.user.username, Math.floor(Date.now() / 1000)]
  );
  await logAdminAction(auth.user.username, "announce", `发布公告「${title}」`);
  return ok();
}
