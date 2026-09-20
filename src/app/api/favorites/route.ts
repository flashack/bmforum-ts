import { NextRequest } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { num, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";

/** POST /api/favorites —— 收藏/取消收藏 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");
  const body = await readBody(req);
  const tid = num(body, "tid");
  if (!Number.isInteger(tid)) return fail("参数错误");

  const exists = await queryOne("SELECT owner FROM favorites WHERE owner = $1 AND tid = $2", [
    auth.user.userid,
    tid,
  ]);
  if (exists) {
    await execute("DELETE FROM favorites WHERE owner = $1 AND tid = $2", [auth.user.userid, tid]);
    return ok({ favorited: false });
  }
  await execute("INSERT INTO favorites (tid, owner, addtime) VALUES ($1, $2, $3)", [
    tid,
    auth.user.userid,
    Math.floor(Date.now() / 1000),
  ]);
  return ok({ favorited: true });
}
