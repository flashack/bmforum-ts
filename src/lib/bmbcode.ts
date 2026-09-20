/**
 * BMBCode 解析器 —— 复刻 BMForum 论坛代码语法
 * 支持：[b][i][u][s][color][size][font][align][center][quote][code][img][url][email][list][hr][flash-lite]
 * 安全策略：先 HTML 转义，URL 仅允许 http/https/相对路径，属性白名单化
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(raw: string): string | null {
  const url = raw.trim();
  if (/^(https?:\/\/|\/)/i.test(url) && !/[\s"'<>]/.test(url)) return url;
  return null;
}

function safeColor(c: string): string | null {
  return /^#[0-9a-fA-F]{3,8}$/.test(c) || /^[a-zA-Z]+$/.test(c) ? c : null;
}

function sizeToPx(n: number): number {
  // BMB size 1-6 映射
  const map = [10, 12, 14, 16, 18, 22, 26];
  return map[Math.max(1, Math.min(6, n))];
}

/** 表情文件清单（public/face/，来自原版 BMForum emotpacks/default） */
export const EMOTICONS: { file: string; name: string }[] = [
  { file: "20.gif", name: "微笑" },
  { file: "29.gif", name: "酷" },
  { file: "36.gif", name: "疑问" },
  { file: "a.gif", name: "拜托" },
  { file: "icon1000.gif", name: "汗" },
  { file: "icon1001.gif", name: "狂汗" },
  { file: "icon1100.gif", name: "大笑" },
  { file: "icon1200.gif", name: "哭泣" },
  { file: "icon1300.gif", name: "生气" },
  { file: "icon1400.gif", name: "惊讶" },
  { file: "icon1500.gif", name: "调皮" },
  { file: "icon1600.gif", name: "可爱" },
  { file: "icon1800.gif", name: "晕" },
  { file: "icon2000.gif", name: "睡觉" },
  { file: "icon2001.gif", name: "打哈欠" },
  { file: "icon2100.gif", name: "加油" },
  { file: "icon3000.gif", name: "爱心" },
  { file: "icon4000.gif", name: "强" },
  { file: "icon4600.gif", name: "弱" },
  { file: "icon5000.gif", name: "赞" },
  { file: "icon7000.gif", name: "疑问脸" },
  { file: "icon8000.gif", name: "害羞" },
  { file: "icon9000.gif", name: "闭嘴" },
  { file: "icon9100.gif", name: "吐舌" },
  { file: "icon9200.gif", name: "无语" },
];

export interface AttachInfo {
  id: number;
  filename: string;
  size: number;
  downloads: number;
}

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * 解析 BMBCode 为 HTML（输入为原始文本，输出已转义的安全 HTML）
 * @param attachMap 附件元数据（用于渲染 [attach=N] 下载块），可选
 */
export function parseBmbCode(input: string, attachMap?: Map<number, AttachInfo>): string {
  let s = escapeHtml(input);

  // 0. 表情 [s:xxx] 与附件 [attach=N]
  s = s.replace(
    /\[s:([A-Za-z0-9]+)\]/g,
    (_m, name: string) =>
      `<img src="/face/${encodeURIComponent(name)}.gif" alt="表情" title="表情" class="inline-block align-middle" />`
  );
  s = s.replace(/\[attach=(\d+)\]/gi, (_m, idStr: string) => {
    const id = parseInt(idStr, 10);
    const a = attachMap?.get(id);
    const name = a?.filename ?? "附件";
    const size = a ? fmtSize(a.size) : "";
    const dl = a && a.downloads > 0 ? ` · 已下载 ${a.downloads} 次` : "";
    return `<div class="bmf-attach"><span class="bmf-attach-icon">📎</span><a href="/api/attachment/${id}" class="bmf-attach-name">${escapeHtml(
      name
    )}</a><span class="bmf-attach-meta">${size}${dl}</span></div>`;
  });

  // 1. 保护 [code] 块
  const codeBlocks: string[] = [];
  s = s.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, (_m, code: string) => {
    codeBlocks.push(`<div class="bmf-code">${code.trim()}</div>`);
    return `\u0000CODE${codeBlocks.length - 1}\u0000`;
  });

  // 2. 引用块（支持嵌套，从最内层开始替换）
  for (let i = 0; i < 5; i++) {
    const before = s;
    s = s.replace(
      /\[quote(?:=([^\]]{1,40}))?\]((?:(?!\[quote(?:=|\]))[\s\S])*?)\[\/quote\]/gi,
      (_m, author: string | undefined, body: string) => {
        const title = author ? `<span class="bmf-quote-title">${author} 回复引用</span><br />` : "";
        return `<div class="bmf-quote">${title}${body.trim()}</div>`;
      }
    );
    if (s === before) break;
  }

  // 3. URL / IMG / EMAIL
  s = s.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, (_m, url: string, text: string) => {
    const u = safeUrl(url);
    return u ? `<a href="${u}" target="_blank" rel="noopener noreferrer">${text}</a>` : text;
  });
  s = s.replace(/\[url\]([^\[]+?)\[\/url\]/gi, (_m, url: string) => {
    const u = safeUrl(url);
    return u ? `<a href="${u}" target="_blank" rel="noopener noreferrer">${url}</a>` : url;
  });
  s = s.replace(/\[img\]([^\[]+?)\[\/img\]/gi, (_m, url: string) => {
    const u = safeUrl(url);
    return u
      ? `<img src="${u}" alt="图片" loading="lazy" style="max-width:100%;border:0;" />`
      : `[无效图片]`;
  });
  s = s.replace(/\[email\]([^\[]+?)\[\/email\]/gi, (_m, mail: string) => {
    return /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(mail.trim())
      ? `<a href="mailto:${mail.trim()}">${mail}</a>`
      : mail;
  });

  // 4. 简单样式标签
  s = s.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>");
  s = s.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>");
  s = s.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
  s = s.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<del>$1</del>");
  s = s.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, '<div style="text-align:center">$1</div>');
  s = s.replace(/\[right\]([\s\S]*?)\[\/right\]/gi, '<div style="text-align:right">$1</div>');
  s = s.replace(/\[hr\]/gi, '<hr style="border:none;border-top:1px solid #ddd;margin:8px 0;" />');

  // 5. 颜色/字号
  s = s.replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, (_m, c: string, body: string) => {
    const col = safeColor(c);
    return col ? `<span style="color:${col}">${body}</span>` : body;
  });
  s = s.replace(/\[size=(\d)\]([\s\S]*?)\[\/size\]/gi, (_m, n: string, body: string) => {
    return `<span style="font-size:${sizeToPx(parseInt(n, 10))}px">${body}</span>`;
  });
  s = s.replace(/\[font=([^\]]{1,30})\]([\s\S]*?)\[\/font\]/gi, (_m, f: string, body: string) => {
    const safe = /^[a-zA-Z\u4e00-\u9fa5 ,]+$/.test(f) ? f : "";
    return safe ? `<span style="font-family:${safe}">${body}</span>` : body;
  });

  // 6. 列表
  s = s.replace(
    /\[list(?:=(1|a))?\]([\s\S]*?)\[\/list\]/gi,
    (_m, ord: string | undefined, body: string) => {
      const items = body
        .split(/\[\*\]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => `<li>${t}</li>`)
        .join("");
      const tag = ord === "1" ? "ol" : "ul";
      const style = ord === "a" ? ' style="list-style-type:lower-alpha"' : "";
      return `<${tag} style="margin:6px 0 6px 22px;padding:0"${style}>${items}</${tag}>`;
    }
  );

  // 7. 换行
  s = s.replace(/\r\n/g, "\n").replace(/\n/g, "<br />");

  // 8. 还原 code 块
  s = s.replace(/\u0000CODE(\d+)\u0000/g, (_m, idx: string) => codeBlocks[parseInt(idx, 10)] ?? "");

  return s;
}

/** 纯文本预览（列表摘要用） */
export function bmbCodeToPlain(input: string, maxLen = 100): string {
  const text = input
    .replace(/\[code\][\s\S]*?\[\/code\]/gi, "[代码]")
    .replace(/\[img\][^\[]*\[\/img\]/gi, "[图片]")
    .replace(/\[attach=\d+\]/gi, "[附件]")
    .replace(/\[s:[A-Za-z0-9]+\]/g, "[表情]")
    .replace(/\[url=([^\]]+)\][\s\S]*?\[\/url\]/gi, "$1")
    .replace(/\[(\/?)[a-z]+(=[^\]]*)?\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}
