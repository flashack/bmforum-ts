import { NextRequest, NextResponse } from "next/server";

/** 统一 JSON 响应 */
export function ok(data: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, ...data });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** 读取并裁剪字符串字段 */
export function str(body: Record<string, unknown>, key: string, maxLen = 500): string {
  const v = body[key];
  return typeof v === "string" ? v.trim().slice(0, maxLen) : "";
}

export function num(body: Record<string, unknown>, key: string): number {
  const v = Number(body[key]);
  return Number.isFinite(v) ? v : NaN;
}

export async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const data = await req.json();
    return typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** 频率限制：两次发帖间隔（秒） */
export const POST_INTERVAL = 15;
