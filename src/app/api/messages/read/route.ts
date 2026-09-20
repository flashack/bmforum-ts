import { NextRequest } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { num, readBody, str, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";

/** POST /api/messages/read —— 标记短消息已读/删除 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");
  const body = await readBody(req);
  const id = num(body, "id");
  const action = str(body, "action", 10) || "read";
  if (!Number.isInteger(id)) return fail("参数错误");

  const msg = await queryOne<{ id: number }>(
    "SELECT id FROM primsg WHERE id = $1 AND belong = $2",
    [id, auth.user.username]
  );
  if (!msg) return fail("消息不存在");
  if (action === "delete") {
    await execute("DELETE FROM primsg WHERE id = $1 AND belong = $2", [id, auth.user.username]);
  } else {
    await execute("UPDATE primsg SET prread = 1 WHERE id = $1 AND belong = $2", [id, auth.user.username]);
  }
  return ok();
}
