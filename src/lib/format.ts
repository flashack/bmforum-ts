/** 通用格式化工具 */

/** 全站统一东八区（UTC+8）显示：显式加偏移后取 UTC 分量，不依赖服务器/容器时区 */
const CN_OFFSET_MS = 8 * 3600 * 1000;

function cnDate(ts: number): Date {
  return new Date(ts * 1000 + CN_OFFSET_MS);
}

export function fmtTime(ts: number): string {
  if (!ts) return "";
  const d = cnDate(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

export function fmtDate(ts: number): string {
  if (!ts) return "";
  const d = cnDate(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

/** 完整日期时间（原版 getfulldate：Y-m-d H:i:s） */
export function fmtFullDate(ts: number): string {
  if (!ts) return "";
  const d = cnDate(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

/** 短日期时间（移动端展示用：MM-DD HH:MM） */
export function fmtShortTime(ts: number): string {
  if (!ts) return "";
  const d = cnDate(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

/** 当前 Unix 秒 */
export function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

/** 东八区当前年份（周岁计算等） */
export function cnYear(): number {
  return new Date(Date.now() + CN_OFFSET_MS).getUTCFullYear();
}

/** 东八区当天零点的 Unix 秒（"今日新帖"等按天统计的基准） */
export function cnDayStart(): number {
  return Math.floor((Date.now() + CN_OFFSET_MS) / 86400000) * 86400 - 8 * 3600;
}

/** 相对时间（原版风格的简洁表达） */
export function fmtRelative(ts: number): string {
  if (!ts) return "从未";
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "1 分钟内";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
  return fmtDate(ts);
}

export function avatarUrl(avatar: string, userid: number): string {
  if (avatar && /^(https?:\/\/|\/)/.test(avatar)) return avatar;
  // 免外链头像：按用户名生成经典色块头像
  return `/api/avatar/${userid}`;
}

export const GROUP_NAMES: Record<number, string> = {
  0: "游客",
  1: "注册会员",
  2: "版主",
  3: "管理员",
  4: "封禁用户",
};

export function groupName(ugnum: number): string {
  return GROUP_NAMES[ugnum] ?? "注册会员";
}

export function groupColor(ugnum: number): string {
  if (ugnum === 3) return "#cc3311";
  if (ugnum === 2) return "#0a7d32";
  if (ugnum === 4) return "#999999";
  return "#444444";
}

export function fmtNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** 分页计算 */
export function paginate(total: number, perPage: number, page: number): {
  page: number;
  pages: number;
  offset: number;
} {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(Math.max(1, page), pages);
  return { page: p, pages, offset: (p - 1) * perPage };
}
