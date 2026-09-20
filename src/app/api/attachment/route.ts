import { NextRequest } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { getAuth, clientIp } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { isIpBanned } from "@/lib/moderation";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** POST /api/attachment —— 上传附件（multipart/form-data） */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录后再上传附件");
  if (!auth.user.canupload) return fail("您所在的用户组无权上传附件", 403);
  if (await isIpBanned(await clientIp())) return fail("您的 IP 已被封禁", 403);

  const form = await req.formData();
  const file = form.get("file");
  const tid = Number(form.get("tid") || 0) || 0;
  if (!(file instanceof File)) return fail("未选择文件");
  if (file.size === 0) return fail("文件为空");
  if (file.size > MAX_SIZE) return fail("附件大小不能超过 5MB");

  const buf = Buffer.from(await file.arrayBuffer());
  const now = Math.floor(Date.now() / 1000);
  const r = await execute(
    `INSERT INTO attachments (tid, filename, mimetype, size, uploader, uploadtime, data)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [tid, file.name.slice(0, 200) || "未命名", file.type || "application/octet-stream", file.size, auth.user.username, now, buf]
  );
  if (!r) return fail("上传失败", 500);
  const row = await queryOne<{ id: number }>(
    "SELECT id FROM attachments WHERE tid = $1 AND uploader = $2 ORDER BY id DESC LIMIT 1",
    [tid, auth.user.username]
  );
  return ok({ id: row?.id, filename: file.name, size: file.size });
}
