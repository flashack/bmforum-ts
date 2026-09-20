import { NextRequest } from "next/server";
import { queryOne, execute } from "@/lib/db";

/** GET /api/attachment/[id] —— 下载附件 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return new Response("参数错误", { status: 400 });

  const row = await queryOne<{
    filename: string;
    mimetype: string;
    data: Buffer;
  }>("SELECT filename, mimetype, data FROM attachments WHERE id = $1", [id]);
  if (!row) return new Response("附件不存在", { status: 404 });

  await execute("UPDATE attachments SET downloads = downloads + 1 WHERE id = $1", [id]);

  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mimetype || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(row.filename)}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
