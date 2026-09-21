import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { queryOne, execute, transaction, query } from "@/lib/db";
import { str, readBody, ok, fail } from "@/lib/api";
import { hashPassword, createSession, clientIp } from "@/lib/auth";
import { isIpBanned, consumeInviteCode } from "@/lib/moderation";
import { checkCaptcha } from "@/lib/captcha";

/** POST /api/auth/register —— 注册 */
export async function POST(req: NextRequest) {
  const ip = await clientIp();
  if (await isIpBanned(ip)) return fail("您的 IP 已被禁止注册", 403);

  const body = await readBody(req);

  // 图形验证码（复刻原版 authimg.php 校验）
  const captchaError = checkCaptcha(body);
  if (captchaError) return fail(captchaError);

  // 站点设置：关闭注册开关
  const closereg = await queryOne<{ value: string }>("SELECT value FROM bbs_config WHERE key = 'closereg'");
  if (closereg?.value === "1") return fail("站点已关闭新用户注册，请联系管理员");

  const username = str(body, "username", 30);
  const password = str(body, "password", 100);
  const mailadd = str(body, "mailadd", 100);
  const invite = str(body, "invitecode", 32);

  if (!username || !password) return fail("用户名和密码不能为空");
  if (!/^[\u4e00-\u9fa5A-Za-z0-9_]{2,30}$/.test(username)) {
    return fail("用户名只能包含中文、字母、数字和下划线，长度 2-30");
  }
  if (password.length < 6) return fail("密码长度至少 6 位");
  if (mailadd && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailadd)) return fail("邮箱格式不正确");

  // 禁止注册名单（复刻原版 banname）
  const banned = await query<{ name: string }>("SELECT name FROM banname WHERE lower(name) = lower($1)", [username]);
  if (banned.length > 0) return fail("该用户名被禁止注册");

  const exists = await queryOne<{ username: string }>(
    "SELECT username FROM userlist WHERE lower(username) = lower($1)",
    [username]
  );
  if (exists) return fail("该用户名已被注册");

  const inviteResult = await consumeInviteCode(invite, username);
  if (!inviteResult.ok) return fail(inviteResult.error || "邀请码无效");

  const salt = randomBytes(8).toString("hex");
  const pwd = hashPassword(password, salt);
  const now = Math.floor(Date.now() / 1000);
  // 注册日期按东八区
  const regdate = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

  await transaction(async (c) => {
    await c.query(
      `INSERT INTO userlist (username, pwd, salt, mailadd, regdate, lastlogin, postamount, point, money,
                             usergroup, headtitle, desper, avatar, online_status, lastpost)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 100, 1, '注册用户', '新手上路', '', 'offline', 0)`,
      [username, pwd, salt, mailadd, regdate, now]
    );
    await c.query("UPDATE lastest SET regednum = regednum + 1");
  });

  const created = await queryOne<{ userid: number }>("SELECT userid FROM userlist WHERE username = $1", [username]);
  if (!created) return fail("注册失败，请重试", 500);
  await createSession(created.userid);
  return ok({ username });
}
