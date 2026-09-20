import { cookies, headers } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { query, queryOne, execute } from "./db";

export const SESSION_COOKIE = "bmf_sid";

export interface SessionUser {
  userid: number;
  username: string;
  usergroup: number;
  headtitle: string;
  postamount: number;
  point: number;
  money: number;
  avatar: string;
  signtext: string;
  mailadd: string;
  homepage: string;
  fromwhere: string;
  sex: string;
  birthday: string;
  newmess: number;
  online_status: string;
  lastpost: number;
}

export interface AuthState {
  user: SessionUser | null;
  isAdmin: boolean;
  isMod: boolean;
}

export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 32).toString("hex");
}

export function verifyPassword(password: string, salt: string, stored: string): boolean {
  try {
    const computed = Buffer.from(hashPassword(password, salt), "hex");
    const target = Buffer.from(stored, "hex");
    return computed.length === target.length && timingSafeEqual(computed, target);
  } catch {
    return false;
  }
}

/** 获取当前登录用户（服务端组件/路由均可调用） */
export async function getAuth(): Promise<AuthState> {
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid) return { user: null, isAdmin: false, isMod: false };
  const user = await queryOne<SessionUser>(
    `SELECT u.userid, u.username, u.usergroup, u.headtitle, u.postamount, u.point,
            u.money, u.avatar, u.signtext, u.mailadd, u.homepage, u.fromwhere,
            u.sex, u.birthday, u.online_status, u.lastpost,
            (SELECT count(*) FROM primsg WHERE belong = u.username AND prread = 0 AND prtype = 'r')::int AS newmess
     FROM sessions s JOIN userlist u ON u.userid = s.userid
     WHERE s.sid = $1`,
    [sid]
  );
  if (!user) return { user: null, isAdmin: false, isMod: false };
  return {
    user,
    isAdmin: user.usergroup === 3,
    isMod: user.usergroup === 2 || user.usergroup === 3,
  };
}

/** 创建会话并写入 Cookie（仅在 Route Handler 中调用） */
export async function createSession(userid: number): Promise<string> {
  const sid = randomBytes(24).toString("hex");
  const now = Math.floor(Date.now() / 1000);
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  await execute(
    "INSERT INTO sessions (sid, userid, logintime, lastactive, ip) VALUES ($1, $2, $3, $3, $4)",
    [sid, userid, now, ip]
  );
  const store = await cookies();
  store.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return sid;
}

/** 注销会话 */
export async function destroySession(): Promise<void> {
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (sid) await execute("DELETE FROM sessions WHERE sid = $1", [sid]);
  (await cookies()).delete(SESSION_COOKIE);
}

/** 记录在线状态 */
export async function touchOnline(
  auth: AuthState,
  filename: string
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  if (auth.user) {
    await execute(
      `INSERT INTO onlinestat (username, onusrid, timestamp, ips, filename, ugnum)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [auth.user.username, auth.user.userid, now, ip, filename, auth.user.usergroup]
    );
  } else {
    await execute(
      `INSERT INTO onlinestat (username, onusrid, timestamp, ips, filename, ugnum)
       VALUES ($1, 0, $2, $3, $4, 0)`,
      ["Guest", now, ip, filename]
    );
  }
  // 清理 15 分钟前的记录
  await execute("DELETE FROM onlinestat WHERE timestamp < $1", [now - 900]);
}

export async function getOnlineStats(): Promise<{
  members: number;
  guests: number;
  list: { username: string; ugnum: number; onusrid: number }[];
}> {
  const now = Math.floor(Date.now() / 1000);
  const list = await query<{ username: string; ugnum: number; onusrid: number }>(
    "SELECT username, ugnum, onusrid FROM onlinestat WHERE timestamp > $1 ORDER BY ugnum DESC, username ASC",
    [now - 900]
  );
  return {
    members: list.filter((u) => u.onusrid > 0).length,
    guests: list.filter((u) => u.onusrid === 0).length,
    list: list.filter((u) => u.onusrid > 0),
  };
}
