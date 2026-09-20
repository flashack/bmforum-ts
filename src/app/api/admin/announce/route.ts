import { NextRequest } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { str, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";

/** POST /api/admin/announce —— 后台：发布公告 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");
  if (!auth.isAdmin) return fail("权限不足");

  const body = await readBody(req);
  const title = str(body, "title", 200);
  const content = str(body, "content", 20000);
  if (!title || !content) return fail("标题和内容不能为空");

  await execute(
    "INSERT INTO announces (title, content, author, addtime) VALUES ($1, $2, $3, $4)",
    [title, content, auth.user.username, Math.floor(Date.now() / 1000)]
  );
  return ok();
}
