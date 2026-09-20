import { NextRequest } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

/** POST /api/usercp/avatar —— 上传自定义头像 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("未选择图片");
  if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) return fail("仅支持 png/jpg/gif/webp");
  if (file.size > MAX_SIZE) return fail("头像不能超过 2MB");

  const buf = Buffer.from(await file.arrayBuffer());
  const now = Math.floor(Date.now() / 1000);
  const r = await execute(
    `INSERT INTO attachments (tid, filename, mimetype, size, uploader, uploadtime, isavatar, data)
     VALUES (0, $1, $2, $3, $4, $5, 1, $6) RETURNING id`,
    [file.name.slice(0, 200), file.type, file.size, auth.user.username, now, buf]
  );
  if (!r) return fail("上传失败", 500);
  const row = await queryOne<{ id: number }>(
    "SELECT id FROM attachments WHERE uploader = $1 AND isavatar = 1 ORDER BY id DESC LIMIT 1",
    [auth.user.username]
  );
  if (!row) return fail("上传失败", 500);
  await execute("UPDATE userlist SET avatar = $2 WHERE userid = $1", [
    auth.user.userid,
    `/api/attachment/${row.id}`,
  ]);
  return ok({ avatar: `/api/attachment/${row.id}` });
}
