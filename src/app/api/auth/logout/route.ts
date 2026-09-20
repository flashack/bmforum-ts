import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { fail } from "@/lib/api";

/** POST /api/auth/logout —— 退出登录 */
export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch {
    return fail("操作失败", 500);
  }
}

/** GET /api/auth/logout —— 链接式退出，重定向回首页 */
export async function GET() {
  try {
    await destroySession();
  } catch {
    /* ignore */
  }
  return NextResponse.redirect(new URL("/", process.env.COZE_PROJECT_DOMAIN_DEFAULT || "http://localhost:5000"));
}
