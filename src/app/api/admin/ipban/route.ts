import { NextRequest } from "next/server";
import { execute } from "@/lib/db";
import { str, num, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { logAdminAction } from "@/lib/moderation";

/** POST /api/admin/ipban —— IP 封禁管理 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);

  const body = await readBody(req);
  const action = str(body, "action", 10);

  if (action === "add") {
    const ip = str(body, "ip", 40);
    const reason = str(body, "reason", 200);
    if (!ip) return fail("请填写 IP 或前缀");
    if (!/^[0-9a-fA-F.:]+$/.test(ip)) return fail("IP 格式不正确");
    await execute("INSERT INTO ipban (ip, reason, addtime) VALUES ($1, $2, $3)", [
      ip,
      reason,
      Math.floor(Date.now() / 1000),
    ]);
    await logAdminAction(auth.user.username, "ipban", `封禁 IP 前缀 ${ip}`);
    return ok();
  }

  if (action === "delete") {
    const id = num(body, "id");
    if (!Number.isInteger(id)) return fail("参数错误");
    await execute("DELETE FROM ipban WHERE id = $1", [id]);
    await logAdminAction(auth.user.username, "ipunban", `解封 IP id=${id}`);
    return ok();
  }

  return fail("未知操作");
}
