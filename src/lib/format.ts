/** 通用格式化工具 */

export function fmtTime(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fmtDate(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
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
};

export function groupName(ugnum: number): string {
  return GROUP_NAMES[ugnum] ?? "注册会员";
}

export function groupColor(ugnum: number): string {
  if (ugnum === 3) return "#cc3311";
  if (ugnum === 2) return "#0a7d32";
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
