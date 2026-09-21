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
  // 相对路径 Location（RFC 7231 允许），避免依赖请求 Host 或环境域名
  return new Response(null, { status: 307, headers: { Location: "/" } });
}
