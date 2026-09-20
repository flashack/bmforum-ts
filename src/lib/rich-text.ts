/**
 * 所见即所得编辑器的双向转换：BMBCode ⇄ 编辑态 HTML
 * 对标原版 BMF 定制 nicEdit（panelInstance('articlecontent') + bmbcode:true）：
 * 编辑区显示富文本，提交前转回 BMBCode 存储；交易/隐藏类标签在编辑态原样显示，
 * 保证作者始终能看到并修改原文。
 */
import { EMOTICONS } from "./bmbcode";

/** 编辑态允许的表情文件名集合 */
const EMO_FILES = new Set(EMOTICONS.map((e) => e.file.replace(/\.gif$/, "")));

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * BMBCode → 编辑区 HTML。
 * 未知标签（[sell]/[gift]/[beg]/[post]/[hpost] 等）原样保留为文本，便于作者编辑原文。
 */
export function bmbcodeToEditHtml(src: string): string {
  let s = src;

  // [code] 块：内部不解析，占位保护
  const codeBlocks: string[] = [];
  s = s.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, (_m, inner: string) => {
    codeBlocks.push(inner);
    return `\u0000C${codeBlocks.length - 1}\u0000`;
  });

  // [quote=作者] / [quote]
  s = s.replace(/\[quote(?:=([^\]]{1,30}))?\]([\s\S]*?)\[\/quote\]/gi, (_m, author: string | undefined, inner: string) => {
    return `<blockquote data-bmb="quote"${author ? ` data-author="${esc(author)}"` : ""}>${inner}</blockquote>`;
  });

  // 列表（[*] 项）
  s = s.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_m, inner: string) => {
    const items = inner
      .split(/\[\*\]/)
      .slice(1)
      .map((it) => `<li>${it.replace(/\n+/g, "")}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });
  s = s.replace(/\[olist\]([\s\S]*?)\[\/olist\]/gi, (_m, inner: string) => {
    const items = inner
      .split(/\[\*\]/)
      .slice(1)
      .map((it) => `<li>${it.replace(/\n+/g, "")}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  });

  // 行内标签
  s = s.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<b>$1</b>");
  s = s.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<i>$1</i>");
  s = s.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
  s = s.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>");
  s = s.replace(/\[sub\]([\s\S]*?)\[\/sub\]/gi, "<sub>$1</sub>");
  s = s.replace(/\[sup\]([\s\S]*?)\[\/sup\]/gi, "<sup>$1</sup>");
  s = s.replace(/\[color=([#a-zA-Z0-9]{3,12})\]([\s\S]*?)\[\/color\]/gi, '<font color="$1">$2</font>');
  s = s.replace(/\[size=([1-7])\]([\s\S]*?)\[\/size\]/gi, '<font size="$1">$2</font>');
  s = s.replace(/\[align=(center|left|right)\]([\s\S]*?)\[\/align\]/gi, '<div align="$1">$2</div>');
  s = s.replace(/\[glow=(\d{1,3}),(#?[a-zA-Z0-9]{3,9})\]([\s\S]*?)\[\/glow\]/gi,
    '<span data-bmb="glow" data-w="$1" data-c="$2">$3</span>');
  s = s.replace(/\[shadow=(\d{1,3}),(#?[a-zA-Z0-9]{3,9})\]([\s\S]*?)\[\/shadow\]/gi,
    '<span data-bmb="shadow" data-w="$1" data-c="$2">$3</span>');

  // 链接与图片
  s = s.replace(/\[url=([^\]\s]{1,300})\]([\s\S]*?)\[\/url\]/gi, '<a href="$1">$2</a>');
  s = s.replace(/\[url\]([^\]\s]{1,300})\[\/url\]/gi, '<a href="$1">$1</a>');
  s = s.replace(/\[img=(\d{1,4}),(\d{1,4})\]([^\]\s]{1,600})\[\/img\]/gi,
    '<img src="$3" width="$1" height="$2" />');
  s = s.replace(/\[img\]([^\]\s]{1,600})\[\/img\]/gi, '<img src="$1" />');

  // 表情 [s:xxx]
  s = s.replace(/\[s:([a-zA-Z0-9_]{1,20})\]/g, (m, name: string) => {
    if (!EMO_FILES.has(name)) return m;
    return `<img src="/face/${esc(name)}.gif" alt="[s:${esc(name)}]" title="[s:${esc(name)}]" data-emo="${esc(name)}" />`;
  });

  // [hr]
  s = s.replace(/\[hr\]/gi, "<hr />");

  // 换行
  s = s.replace(/\r\n/g, "\n").replace(/\n/g, "<br />");

  // 还原 code 块
  s = s.replace(/\u0000C(\d+)\u0000/g, (_m, idx: string) => {
    return `<pre data-bmb="code">${esc(codeBlocks[parseInt(idx, 10)] ?? "")}</pre>`;
  });

  return s;
}

/** 判断元素是否块级（决定转换时是否补换行） */
function isBlock(el: Element): boolean {
  const tag = el.tagName;
  return tag === "DIV" || tag === "P" || tag === "UL" || tag === "OL" || tag === "BLOCKQUOTE" || tag === "PRE" || tag === "HR" || tag === "TABLE";
}

/** 编辑区 HTML → BMBCode（遍历 DOM 树） */
export function editHtmlToBmbcode(root: HTMLElement): string {
  const out: string[] = [];

  const walkText = (text: string): string => text;

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      out.push(walkText(node.nodeValue ?? ""));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName;

    switch (tag) {
      case "BR":
        out.push("\n");
        return;
      case "HR":
        out.push("[hr]");
        return;
      case "IMG": {
        const emo = el.getAttribute("data-emo");
        if (emo) {
          out.push(`[s:${emo}]`);
        } else {
          const src = el.getAttribute("src") ?? "";
          const w = el.getAttribute("width");
          const h = el.getAttribute("height");
          if (src) out.push(w && h ? `[img=${parseInt(w, 10)},${parseInt(h, 10)}]${src}[/img]` : `[img]${src}[/img]`);
        }
        return;
      }
      case "A": {
        const href = el.getAttribute("href") ?? "";
        const text = el.textContent ?? "";
        out.push(href && href !== text ? `[url=${href}]${text}[/url]` : `[url]${text}[/url]`);
        return;
      }
      case "PRE": {
        out.push(`[code]${el.textContent ?? ""}[/code]`);
        return;
      }
      case "BLOCKQUOTE": {
        const author = el.getAttribute("data-author");
        out.push(author ? `[quote=${author}]` : "[quote]");
        el.childNodes.forEach(walk);
        out.push("[/quote]");
        return;
      }
      case "UL":
      case "OL": {
        const open = tag === "UL" ? "[list]" : "[olist]";
        out.push(open);
        el.querySelectorAll(":scope > li").forEach((li) => {
          out.push("[*]");
          li.childNodes.forEach(walk);
          out.push("\n");
        });
        out.push(tag === "UL" ? "[/list]" : "[/olist]");
        return;
      }
      case "B":
      case "STRONG":
        out.push("[b]");
        el.childNodes.forEach(walk);
        out.push("[/b]");
        return;
      case "I":
      case "EM":
        out.push("[i]");
        el.childNodes.forEach(walk);
        out.push("[/i]");
        return;
      case "U":
        out.push("[u]");
        el.childNodes.forEach(walk);
        out.push("[/u]");
        return;
      case "S":
      case "STRIKE":
      case "DEL":
        out.push("[s]");
        el.childNodes.forEach(walk);
        out.push("[/s]");
        return;
      case "SUB":
        out.push("[sub]");
        el.childNodes.forEach(walk);
        out.push("[/sub]");
        return;
      case "SUP":
        out.push("[sup]");
        el.childNodes.forEach(walk);
        out.push("[/sup]");
        return;
      case "FONT": {
        const color = el.getAttribute("color");
        const size = el.getAttribute("size");
        if (color) out.push(`[color=${color}]`);
        if (size) out.push(`[size=${parseInt(size, 10) || 3}]`);
        el.childNodes.forEach(walk);
        if (size) out.push("[/size]");
        if (color) out.push("[/color]");
        return;
      }
      case "SPAN": {
        const kind = el.getAttribute("data-bmb");
        if (kind === "glow" || kind === "shadow") {
          const w = el.getAttribute("data-w") ?? "2";
          const c = el.getAttribute("data-c") ?? "#3399ff";
          out.push(`[${kind}=${w},${c}]`);
          el.childNodes.forEach(walk);
          out.push(`[/${kind}]`);
        } else {
          // 普通 span（编辑器产生的包裹），透传内容
          el.childNodes.forEach(walk);
        }
        return;
      }
      case "DIV":
      case "P": {
        const align = el.getAttribute("align") || el.style.textAlign;
        const inner = align === "center" || align === "left" || align === "right";
        if (inner) out.push(`[align=${align}]`);
        el.childNodes.forEach(walk);
        if (inner) out.push("[/align]");
        else out.push("\n");
        return;
      }
      default: {
        // 未知元素：透传子内容；块级补换行
        el.childNodes.forEach(walk);
        if (isBlock(el)) out.push("\n");
      }
    }
  };

  root.childNodes.forEach(walk);

  let s = out.join("");
  // 规范化：连续 3+ 换行压成 2 个
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return s;
}
