import { NextRequest } from "next/server";
import { newCaptcha } from "@/lib/captcha";
import { ok } from "@/lib/api";

/** GET /api/captcha —— 图形验证码（复刻原版 authimg.php） */
export async function GET(_req: NextRequest) {
  return ok(newCaptcha());
}
