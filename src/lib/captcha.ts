import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * 图形验证码（复刻原版 authimg.php）
 * 无状态实现：答案 + 过期时间装入 HMAC 签名 token，提交时验签比对。
 */

const SECRET = process.env.BMF_CAPTCHA_SECRET || process.env.DATABASE_URL || "bmf-captcha-fallback-secret";
const TTL = 10 * 60; // 10 分钟有效

/** 剔除易混淆字符后的数字+大写字母集 */
const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function makeToken(code: string): string {
  const expiry = Math.floor(Date.now() / 1000) + TTL;
  const payload = Buffer.from(`${code}|${expiry}`).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyCaptchaToken(token: string, answer: string): boolean {
  if (!token || !answer) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expect = createHmac("sha256", SECRET).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const [code, expiryStr] = Buffer.from(payload, "base64url").toString("utf8").split("|");
  const expiry = Number(expiryStr);
  if (!Number.isInteger(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;
  return code.toUpperCase() === answer.trim().toUpperCase();
}

/** 注册等场景复用的校验入口：返回错误文案或 null */
export function checkCaptcha(body: Record<string, unknown>): string | null {
  const token = typeof body.captchaToken === "string" ? body.captchaToken : "";
  const answer = typeof body.captcha === "string" ? body.captcha : "";
  if (!verifyCaptchaToken(token, answer)) return "验证码错误或已过期";
  return null;
}

function renderSvg(code: string): string {
  const rnd = randomBytes(code.length + 4);
  const chars: string[] = [];
  for (let i = 0; i < code.length; i++) {
    const x = 12 + i * 20 + (rnd[i] % 6);
    const y = 26 + (rnd[i] % 10);
    const rot = rnd[i] % 30 - 15;
    const color = `#${((rnd[i] * 977) % 0x888888).toString(16).padStart(6, "0")}`;
    chars.push(
      `<text x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" font-family="Georgia,serif" font-size="24" font-weight="bold" fill="${color}">${code[i]}</text>`
    );
  }
  const lines: string[] = [];
  for (let i = 0; i < 4; i++) {
    const y = 6 + i * 9 + (rnd[code.length + i] % 5);
    lines.push(
      `<line x1="${rnd[code.length + i] % 10}" y1="${y}" x2="${100 - (rnd[(i + 1) % code.length] % 10)}" y2="${y + 6}" stroke="#cccccc" stroke-width="1" />`
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="40" viewBox="0 0 110 40"><rect width="110" height="40" fill="#f7f7f7"/>${lines.join("")}${chars.join("")}</svg>`;
}

/** 生成一道新验证码题 */
export function newCaptcha(): { token: string; svg: string } {
  const rnd = randomBytes(5);
  let code = "";
  for (let i = 0; i < 5; i++) code += CHARS[rnd[i] % CHARS.length];
  return { token: makeToken(code), svg: renderSvg(code) };
}
