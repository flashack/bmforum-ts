import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { query, execute } from "@/lib/db";
import { num, str, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { logAdminAction, getConfig, setConfig } from "@/lib/moderation";

/** POST /api/admin/invite —— 邀请注册管理 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);

  const body = await readBody(req);
  const action = str(body, "action", 10);

  if (action === "toggle") {
    const cur = (await getConfig("invitereg")) === "1";
    await setConfig("invitereg", cur ? "0" : "1");
    await logAdminAction(auth.user.username, "invitetoggle", `邀请注册 ${cur ? "关闭" : "开启"}`);
    return ok({ enabled: !cur });
  }

  if (action === "generate") {
    const n = Math.min(num(body, "n") || 10, 50);
    const now = Math.floor(Date.now() / 1000);
    const codes: string[] = [];
    for (let i = 0; i < n; i++) {
      codes.push(`BMF-${randomBytes(5).toString("hex").toUpperCase()}`);
    }
    for (const code of codes) {
      await execute(
        "INSERT INTO invitecode (code, createtime) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING",
        [code, now]
      );
    }
    await logAdminAction(auth.user.username, "invitegen", `生成 ${n} 个邀请码`);
    return ok({ codes });
  }

  if (action === "delete") {
    const id = num(body, "id");
    if (!Number.isInteger(id)) return fail("参数错误");
    await execute("DELETE FROM invitecode WHERE id = $1", [id]);
    await logAdminAction(auth.user.username, "invitedel", `删除邀请码 id=${id}`);
    return ok();
  }

  return fail("未知操作");
}

/** GET /api/admin/invite —— 邀请码列表与开关状态 */
export async function GET() {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);
  const list = await query<{ id: number; code: string; usedby: string; usedtime: number; createtime: number }>(
    "SELECT id, code, usedby, usedtime, createtime FROM invitecode ORDER BY id DESC LIMIT 100"
  );
  return ok({ list, enabled: (await getConfig("invitereg")) === "1" });
}
