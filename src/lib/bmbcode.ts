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

/** beg 表行（出售/礼金/求赏流水，id = 帖子id+"1"/"2"/"3"） */
export interface BegRow {
  beglog: string;
  giftid: string;
  begers: number;
  begmoneys: number;
}

/** 交易标签渲染上下文（服务端按帖子装配） */
export interface TradeCtx {
  postId: number;
  viewerLogged: boolean;
  viewerIsAuthor: boolean;
  viewerIsStarter: boolean;
  viewerIsAdmin: boolean;
  viewerBought: boolean;
  isFirstPost: boolean;
  sellMoney: number;
  giftMoney: number;
  /** 出售流水（beg id = 帖子id + "1"） */
  begSell: BegRow | null;
  /** 礼金流水（beg id = 主题tid + "2"） */
  begGift: BegRow | null;
  /** 求赏流水（beg id = 帖子id + "3"） */
  begBeg: BegRow | null;
  moneyUnit: string;
}

function tradeButton(kind: string, pid: number, label: string, extra = ""): string {
  return `<button type="button" class="bmf-btn bmf-trade-btn" data-trade="${kind}" data-pid="${pid}"${extra}>${label}</button>`;
}

/** [sell=M] 出售内容（复刻原版 sellit() sell 分支） */
function renderSellBox(money: number, innerHtml: string, ctx: TradeCtx): string {
  const unit = ctx.moneyUnit;
  const begers = ctx.begSell?.begers ?? 0;
  const begmoneys = ctx.begSell?.begmoneys ?? 0;
  const buyerNames = (ctx.begSell?.beglog ?? "").split(",").filter(Boolean);
  const buyerList = buyerNames.length
    ? `<span class="bmf-trade-meta">（${buyerNames.join("、")}）</span>`
    : "";
  const info = `[此帖售价 ${money} ${unit}，已有 ${begers} 人购买　作者已收入: ${begmoneys} ${unit}]${buyerList}`;

  const canRead = ctx.viewerIsAuthor || ctx.viewerIsAdmin || ctx.viewerBought;
  const refundBtn =
    ctx.viewerIsAuthor || ctx.viewerIsAdmin
      ? `　${tradeButton("refund", ctx.postId, "退款")}`
      : "";

  if (canRead) {
    return `<div class="bmf-trade"><div class="bmf-trade-head"><strong>${info}</strong>${refundBtn}</div><hr class="bmf-trade-hr" />${innerHtml}</div>`;
  }
  const action = ctx.viewerLogged
    ? tradeButton("buy", ctx.postId, "算你狠。。我买，我付钱")
    : `<span class="bmf-trade-meta">请先 <a href="/login">登录</a> 后购买</span>`;
  return `<div class="bmf-trade"><div class="bmf-trade-head"><strong>${info}</strong></div><hr class="bmf-trade-hr" /><div class="bmf-trade-locked">${action}</div></div>`;
}

/** [gift=M] 礼金帖（复刻 sellit() gift 分支，仅在首帖生效） */
function renderGiftBox(money: number, innerHtml: string, ctx: TradeCtx): string {
  if (!ctx.isFirstPost) return innerHtml;
  const unit = ctx.moneyUnit;
  let receivers = "";
  if (ctx.begGift && ctx.begGift.begers > 0) {
    const names = ctx.begGift.beglog.split(",").filter(Boolean);
    receivers =
      `<div class="bmf-trade"><div class="bmf-trade-head"><strong>下列用户收到了礼金, 共计发出了礼金 ${ctx.begGift.begmoneys} ${unit}　发送礼金次数: ${ctx.begGift.begers}</strong></div>` +
      `<hr class="bmf-trade-hr" /><div class="bmf-trade-list">${names.join("<br />")}</div></div>`;
  }
  return (
    `<div class="bmf-trade"><div class="bmf-trade-head"><strong>[本帖是礼金帖.帖子作者可以对回复者发放礼金.礼金数为: ${money} ${unit}]</strong></div>` +
    `<hr class="bmf-trade-hr" />${innerHtml}</div>${receivers}`
  );
}

/** [beg] 求赏帖（复刻 sellit() beg 分支） */
function renderBegBox(innerHtml: string, ctx: TradeCtx): string {
  const unit = ctx.moneyUnit;
  let donors = "";
  if (ctx.begBeg && ctx.begBeg.begers > 0) {
    const rows = ctx.begBeg.beglog
      .split(",")
      .filter(Boolean)
      .map((e) => {
        const [name, amount] = e.split("|");
        return `${name} - ${amount} ${unit}`;
      });
    donors =
      `<div class="bmf-trade"><div class="bmf-trade-head"><strong>捐助者名单　受捐总额: ${ctx.begBeg.begmoneys} ${unit}　会员数: ${ctx.begBeg.begers}</strong></div>` +
      `<hr class="bmf-trade-hr" /><div class="bmf-trade-list">${rows.join("<br />")}</div></div>`;
  }
  const donate =
    ctx.viewerLogged && !ctx.viewerIsAuthor
      ? `<div class="bmf-trade-donate">我要捐助 <input type="text" size="5" class="bmf-beg-input" data-pid="${ctx.postId}" /> ${unit} ${tradeButton("beg", ctx.postId, "捐助")}</div>`
      : "";
  return (
    `<div class="bmf-trade"><div class="bmf-trade-head"><strong>[本帖是乞讨帖.您可以给帖子作者一定金额 ${unit} 的援助.]</strong></div>` +
    `<hr class="bmf-trade-hr" />${innerHtml}${donate}</div>${donors}`
  );
}

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * 解析 BMBCode 为 HTML（输入为原始文本，输出已转义的安全 HTML）
 * @param attachMap 附件元数据（用于渲染 [attach=N] 下载块），可选
 * @param trade 交易标签上下文（用于渲染 [sell]/[gift]/[beg]），可选
 */
export function parseBmbCode(input: string, attachMap?: Map<number, AttachInfo>, trade?: TradeCtx): string {
  // -1. 交易标签预提取（内部递归完整解析，主体中用占位符还原）
  const tradeBlocks: string[] = [];
  let raw = input;
  if (trade) {
    raw = raw.replace(
      /\[sell=(\d{1,9})\]([\s\S]*?)\[\/sell\]/gi,
      (_m, moneyStr: string, inner: string) => {
        const html = renderSellBox(parseInt(moneyStr, 10), parseBmbCode(inner, attachMap), trade);
        tradeBlocks.push(html);
        return `\u0000TRADE${tradeBlocks.length - 1}\u0000`;
      }
    );
    raw = raw.replace(/\[gift=(\d{1,9})\]([\s\S]*?)\[\/gift\]/gi, (_m, moneyStr: string, inner: string) => {
      const html = renderGiftBox(parseInt(moneyStr, 10), parseBmbCode(inner, attachMap), trade);
      tradeBlocks.push(html);
      return `\u0000TRADE${tradeBlocks.length - 1}\u0000`;
    });
    raw = raw.replace(/\[beg\]([\s\S]*?)\[\/beg\]/gi, (_m, inner: string) => {
      const html = renderBegBox(parseBmbCode(inner, attachMap), trade);
      tradeBlocks.push(html);
      return `\u0000TRADE${tradeBlocks.length - 1}\u0000`;
    });
  }

  let s = escapeHtml(raw);

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

  // 8. 还原 code 块与交易块
  s = s.replace(/\u0000CODE(\d+)\u0000/g, (_m, idx: string) => codeBlocks[parseInt(idx, 10)] ?? "");
  s = s.replace(/\u0000TRADE(\d+)\u0000/g, (_m, idx: string) => tradeBlocks[parseInt(idx, 10)] ?? "");

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
