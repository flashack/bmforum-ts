import { NextRequest } from "next/server";
import { query, execute } from "@/lib/db";
import { readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { logAdminAction } from "@/lib/moderation";

/** 可由后台修改的站点设置项（对应原版 include/admin/setoptions.php） */
const OPTION_KEYS: { key: string; label: string; type: "text" | "bool"; def: string }[] = [
  { key: "bbs_title", label: "论坛名称", type: "text", def: "BMForum 论坛" },
  { key: "short_title", label: "论坛简称（英文）", type: "text", def: "BMForum" },
  { key: "bbs_des", label: "论坛描述", type: "text", def: "" },
  { key: "footer_text", label: "页脚版权文字", type: "text", def: "Powered by BMForum.com" },
  { key: "welcomemess", label: "导航栏欢迎语", type: "text", def: "欢迎光临，祝您愉快！" },
  { key: "moneyunit", label: "金钱单位名称", type: "text", def: "金钱" },
  { key: "perpage", label: "每页显示帖子数", type: "text", def: "10" },
  { key: "closereg", label: "关闭新用户注册", type: "bool", def: "0" },
];

/** GET /api/admin/options —— 读取全部站点设置 */
export async function GET() {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM bbs_config");
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return ok({
    options: OPTION_KEYS.map((o) => ({ ...o, value: map.get(o.key) ?? o.def })),
  });
}

/** POST /api/admin/options —— 保存站点设置 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);

  const body = await readBody(req);
  const updates: { key: string; value: string }[] = [];
  for (const o of OPTION_KEYS) {
    const v = body[o.key];
    if (typeof v !== "string") continue;
    const value = o.type === "bool" ? (v === "1" ? "1" : "0") : v.trim().slice(0, 200);
    if (o.key === "perpage" && value && (!/^\d{1,3}$/.test(value) || Number(value) < 5 || Number(value) > 100)) {
      return fail("每页显示帖子数需为 5-100 的整数");
    }
    updates.push({ key: o.key, value });
  }
  if (updates.length === 0) return fail("没有需要保存的设置");

  for (const u of updates) {
    await execute(
      "INSERT INTO bbs_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [u.key, u.value]
    );
  }
  await logAdminAction(auth.user.username, "setoptions", `更新站点设置（${updates.map((u) => u.key).join(", ")}）`);
  return ok({ message: "站点设置已保存" });
}
