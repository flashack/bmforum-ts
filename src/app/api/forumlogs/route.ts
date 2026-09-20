import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { execute } from "@/lib/db";
import { ok, fail } from "@/lib/api";

/** POST /api/forumlogs —— 版块日志清空（原版 forumlogs.php addon=clean，仅管理员） */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || auth.user.usergroup !== 3) return fail("权限不足", 403);

  const body = (await req.json().catch(() => ({}))) as { action?: string; fid?: number };
  const fid = Number(body.fid) || 0;
  if (body.action !== "clean" || fid <= 0) return fail("参数错误");

  await execute("DELETE FROM forumlog WHERE fid = $1", [fid]);
  await execute(
    `INSERT INTO forumlog (fid, time, operator, action, detail) VALUES ($1, $2, $3, $4, $5)`,
    [fid, Math.floor(Date.now() / 1000), auth.user.username, "clean", "清空版块日志"]
  );
  return ok({ ok: true, message: "版块日志已清空" });
}
