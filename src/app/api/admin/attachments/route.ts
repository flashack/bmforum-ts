import { NextRequest } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { num, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { logAdminAction } from "@/lib/moderation";

/**
 * 删除附件（原版 include/admin/attachment.php）
 * 支持 POST {action:"delete", id} 与 DELETE /api/admin/attachments?id=N
 * 附件二进制存于 attachments.data，删除记录即可
 */
async function deleteAttachment(id: number, operator: string) {
  const row = await queryOne<{ id: number; filename: string; tid: number }>(
    "SELECT id, filename, tid FROM attachments WHERE id = $1",
    [id]
  );
  if (!row) return fail("附件不存在");

  await execute("DELETE FROM attachments WHERE id = $1", [id]);
  await logAdminAction(operator, "attachment", `删除附件 #${id}：${row.filename}`);
  return ok({ message: "附件已删除" });
}

/** POST /api/admin/attachments —— 删除附件（body: {action:"delete", id}） */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);

  const body = await readBody(req);
  const id = num(body, "id");
  if (!Number.isInteger(id) || id <= 0) return fail("附件参数错误");
  return deleteAttachment(id, auth.user.username);
}

/** DELETE /api/admin/attachments?id=N —— 删除附件 */
export async function DELETE(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return fail("附件参数错误");
  return deleteAttachment(id, auth.user.username);
}
