import { query, queryOne, execute } from "./db";
import { clientIp } from "./auth";

/** 敏感词过滤：按 wordfilter 表逐条替换 */
export async function applyWordFilter(text: string): Promise<string> {
  if (!text) return text;
  const rows = await query<{ find: string; replacewith: string }>(
    "SELECT find, replacewith FROM wordfilter"
  );
  let out = text;
  for (const w of rows) {
    if (!w.find) continue;
    out = out.split(w.find).join(w.replacewith || "*");
  }
  return out;
}

/** 客户端 IP 是否命中封禁前缀 */
export async function isIpBanned(ip?: string): Promise<boolean> {
  const realIp = ip || (await clientIp());
  if (!realIp) return false;
  const rows = await query<{ ip: string }>("SELECT ip FROM ipban");
  return rows.some((r) => r.ip && realIp.startsWith(r.ip));
}

/** 写管理日志 */
export async function logAdminAction(
  operator: string,
  action: string,
  detail = ""
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await execute(
    "INSERT INTO adminlog (time, operator, action, detail) VALUES ($1, $2, $3, $4)",
    [now, operator, action, detail]
  );
}

/** 读取配置项 */
export async function getConfig(key: string): Promise<string> {
  const row = await queryOne<{ value: string }>(
    "SELECT value FROM config WHERE key = $1",
    [key]
  );
  return row?.value ?? "";
}

/** 写配置项 */
export async function setConfig(key: string, value: string): Promise<void> {
  await execute(
    "INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
    [key, value]
  );
}

/** 检查邀请码并标记使用；未启用邀请注册时直接通过 */
export async function consumeInviteCode(
  code: string,
  username: string
): Promise<{ ok: boolean; error?: string }> {
  const enabled = (await getConfig("invitereg")) === "1";
  if (!enabled) return { ok: true };
  if (!code) return { ok: false, error: "本站开启了邀请注册，请填写邀请码" };
  const row = await queryOne<{ id: number }>(
    "SELECT id FROM invitecode WHERE code = $1 AND usedby = ''",
    [code]
  );
  if (!row) return { ok: false, error: "邀请码无效或已被使用" };
  const now = Math.floor(Date.now() / 1000);
  await execute(
    "UPDATE invitecode SET usedby = $2, usedtime = $3 WHERE id = $1",
    [row.id, username, now]
  );
  return { ok: true };
}

/** 发送站内通知 */
export async function sendNotification(
  senderid: number,
  sendername: string,
  receiverid: number,
  ntype: string,
  nvalue: string,
  pkey: number
): Promise<void> {
  if (!receiverid || receiverid === senderid) return;
  const now = Math.floor(Date.now() / 1000);
  await execute(
    `INSERT INTO notification (senderid, sendername, receiverid, ntype, nvalue, pkey, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [senderid, sendername, receiverid, ntype, nvalue, pkey, now]
  );
}
