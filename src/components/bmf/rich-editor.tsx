"use client";

/**
 * 所见即所得编辑器（复刻原版 BMF 定制 nicEdit 的 panelInstance('articlecontent')）：
 * 富文本工具栏 + contenteditable 编辑区，可随时切换 BMBCode 源码模式；
 * 提交前由 PostEditor 调用 handle.getBmbcode() 转回 BMBCode 存储。
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { EMOTICONS } from "@/lib/bmbcode";
import { bmbcodeToEditHtml, editHtmlToBmbcode } from "@/lib/rich-text";

export interface RichEditorHandle {
  /** 将当前编辑区内容转回 BMBCode 并触发 onChange；返回最新 BMBCode 文本 */
  getBmbcode: () => string;
  /** 在光标处插入 BMBCode 片段（源码模式插入文本；富文本模式插入纯文本） */
  insertAtCursor: (text: string) => void;
}

interface RichEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
}

type ToolAction =
  | { cmd: string; arg?: string; icon: string; title: string }
  | { custom: "link" | "image" | "code" | "quote" | "emoticon"; icon: string; title: string };

const TOOLS: (ToolAction[] | "sep")[] = [
  [
    { cmd: "bold", icon: "B", title: "加粗" },
    { cmd: "italic", icon: "I", title: "斜体" },
    { cmd: "underline", icon: "U", title: "下划线" },
    { cmd: "strikeThrough", icon: "S", title: "删除线" },
  ],
  "sep",
  [
    { cmd: "subscript", icon: "X₂", title: "下标" },
    { cmd: "superscript", icon: "X²", title: "上标" },
  ],
  "sep",
  [
    { cmd: "justifyLeft", icon: "⬅", title: "左对齐" },
    { cmd: "justifyCenter", icon: "↔", title: "居中" },
    { cmd: "justifyRight", icon: "➡", title: "右对齐" },
  ],
  "sep",
  [
    { cmd: "insertUnorderedList", icon: "•≡", title: "无序列表" },
    { cmd: "insertOrderedList", icon: "1≡", title: "有序列表" },
    { cmd: "indent", icon: "⇥", title: "增加缩进" },
    { cmd: "outdent", icon: "⇤", title: "减少缩进" },
  ],
  "sep",
  [
    { custom: "link", icon: "🔗", title: "插入链接" },
    { custom: "image", icon: "🖼", title: "插入图片" },
    { custom: "quote", icon: "❝", title: "引用" },
    { custom: "code", icon: "{ }", title: "代码" },
    { custom: "emoticon", icon: "☺", title: "表情" },
  ],
];

const COLORS = ["#444444", "#cc3311", "#dd6600", "#228822", "#1155cc", "#8822aa", "#996600", "#ffffff"];

function escapeForPre(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const RichEditor = forwardRef<RichEditorHandle, RichEditorProps>(function RichEditor(
  { value, onChange, placeholder, minHeight = 260 },
  ref
) {
  const [mode, setMode] = useState<"wysiwyg" | "source">("wysiwyg");
  const [emoOpen, setEmoOpen] = useState(false);
  const editableRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const colorRef = useRef<HTMLInputElement | null>(null);
  const dirtyRef = useRef(false);

  /** 当前编辑区是否为富文本模式 */
  const inWysiwyg = mode === "wysiwyg";

  const flushWysiwyg = useCallback((): string => {
    if (!inWysiwyg || !editableRef.current) return value;
    const bc = editHtmlToBmbcode(editableRef.current);
    if (dirtyRef.current) onChange(bc);
    dirtyRef.current = false;
    return bc;
  }, [inWysiwyg, onChange, value]);

  useImperativeHandle(ref, () => ({
    getBmbcode: () => {
      if (inWysiwyg) return flushWysiwyg();
      return textareaRef.current ? textareaRef.current.value : value;
    },
    insertAtCursor: (text: string) => {
      if (inWysiwyg) {
        editableRef.current?.focus();
        document.execCommand("insertHTML", false, escapeForPre(text));
        dirtyRef.current = true;
      } else if (textareaRef.current) {
        const el = textareaRef.current;
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const next = el.value.slice(0, start) + text + el.value.slice(end);
        el.value = next;
        onChange(next);
        requestAnimationFrame(() => {
          el.focus();
          el.selectionStart = start + text.length;
          el.selectionEnd = start + text.length;
        });
      }
    },
  }));

  /** 模式切换时双向同步 */
  const switchMode = (next: "wysiwyg" | "source") => {
    if (next === mode) return;
    if (next === "source") {
      // wysiwyg → source：转换写回
      const bc = flushWysiwyg();
      setMode("source");
      requestAnimationFrame(() => {
        if (textareaRef.current) textareaRef.current.value = bc;
      });
    } else {
      // source → wysiwyg
      const cur = textareaRef.current ? textareaRef.current.value : value;
      onChange(cur);
      setMode("wysiwyg");
      requestAnimationFrame(() => {
        if (editableRef.current) {
          editableRef.current.innerHTML = bmbcodeToEditHtml(cur);
          dirtyRef.current = false;
        }
      });
    }
    setEmoOpen(false);
  };

  useEffect(() => {
    // 初始挂载注入内容
    if (mode === "wysiwyg" && editableRef.current && !dirtyRef.current && editableRef.current.innerHTML === "") {
      editableRef.current.innerHTML = bmbcodeToEditHtml(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd: string, arg?: string) => {
    editableRef.current?.focus();
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(cmd, false, arg);
    dirtyRef.current = true;
  };

  const insertHtml = (html: string) => {
    editableRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    dirtyRef.current = true;
  };

  const getSelectionText = (): string => {
    const sel = window.getSelection();
    return sel ? sel.toString() : "";
  };

  const doCustom = (kind: "link" | "image" | "code" | "quote") => {
    editableRef.current?.focus();
    if (kind === "link") {
      const url = window.prompt("链接地址：", "https://");
      if (url && url !== "https://") {
        const text = getSelectionText() || url;
        insertHtml(`<a href="${escapeForPre(url)}">${escapeForPre(text)}</a>`);
      }
      return;
    }
    if (kind === "image") {
      const src = window.prompt("图片地址：", "https://");
      if (src && src !== "https://") insertHtml(`<img src="${escapeForPre(src)}" />`);
      return;
    }
    if (kind === "quote") {
      const text = getSelectionText();
      if (text) insertHtml(`<blockquote data-bmb="quote">${escapeForPre(text)}</blockquote>`);
      else insertHtml(`<blockquote data-bmb="quote"><br /></blockquote>`);
      return;
    }
    if (kind === "code") {
      const text = getSelectionText();
      insertHtml(`<pre data-bmb="code">${escapeForPre(text)}</pre><br />`);
    }
  };

  return (
    <div className="bmf-rich">
      {/* 模式切换 */}
      <div className="flex items-center gap-2 border-b border-[#ddd] bg-[#f5f5f5] px-2 py-1 text-xs">
        <span className="font-bold text-[#3083be]">发帖编辑器</span>
        <button type="button" onClick={() => switchMode("wysiwyg")} className={mode === "wysiwyg" ? "bmf-tab-on" : "bmf-tab-off"}>
          所见即所得
        </button>
        <button type="button" onClick={() => switchMode("source")} className={mode === "source" ? "bmf-tab-on" : "bmf-tab-off"}>
          BMBCode 源码
        </button>
      </div>

      {inWysiwyg ? (
        <>
          {/* 工具栏 */}
          <div className="flex flex-wrap items-center gap-1 border-b border-[#ddd] bg-[#f5f5f5] px-2 py-1">
            {TOOLS.map((group, gi) =>
              group === "sep" ? (
                <span key={`sep${gi}`} className="mx-1 inline-block h-4 w-px bg-[#ccc]" />
              ) : (
                <span key={`g${gi}`} className="flex items-center gap-1">
                  {group.map((t) =>
                    "custom" in t ? (
                      <button
                        key={t.custom}
                        type="button"
                        title={t.title}
                        className="bmf-tool-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => (t.custom === "emoticon" ? setEmoOpen((v) => !v) : doCustom(t.custom))}
                      >
                        {t.icon}
                      </button>
                    ) : (
                      <button
                        key={t.cmd}
                        type="button"
                        title={t.title}
                        className="bmf-tool-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => exec(t.cmd, t.arg)}
                      >
                        {t.icon}
                      </button>
                    )
                  )}
                </span>
              )
            )}
            {/* 字号 */}
            <select
              title="字号"
              className="bmf-tool-select"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) exec("fontSize", e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">字号</option>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {/* 颜色 */}
            <span className="relative inline-flex">
              <button type="button" title="字体颜色" className="bmf-tool-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => colorRef.current?.click()}>
                <span className="inline-block h-3 w-3 border border-[#999]" style={{ background: "linear-gradient(135deg,#cc3311 25%,#1155cc 25% 50%,#228822 50% 75%,#8822aa 75%)" }} />
                A
              </button>
              <input
                ref={colorRef}
                type="color"
                className="absolute left-0 top-0 h-0 w-0 opacity-0"
                onChange={(e) => exec("foreColor", e.target.value)}
              />
            </span>
            {/* 快捷色 */}
            {COLORS.slice(0, 5).map((c) => (
              <button key={c} type="button" title={`颜色 ${c}`} className="bmf-color-dot" style={{ background: c }} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("foreColor", c)} />
            ))}
          </div>

          {/* 表情面板 */}
          {emoOpen && (
            <div className="bmf-emot-panel border-b border-[#ddd] bg-white p-2">
              {EMOTICONS.map((e) => {
                const name = e.file.replace(/\.gif$/, "");
                return (
                  <button
                    key={e.file}
                    type="button"
                    title={e.name}
                    className="p-0.5"
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => {
                      insertHtml(`<img src="/face/${encodeURIComponent(name)}.gif" data-emo="${name}" alt="[s:${name}]" title="[s:${name}]" />`);
                      setEmoOpen(false);
                    }}
                  >
                    <img src={`/face/${encodeURIComponent(name)}.gif`} alt={e.name} title={e.name} width="24" height="24" />
                  </button>
                );
              })}
            </div>
          )}

          {/* 编辑区 */}
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label={placeholder ?? "正文"}
            className="bmf-rich-area"
            style={{ minHeight }}
            data-placeholder={placeholder}
            onInput={() => {
              dirtyRef.current = true;
            }}
            onBlur={() => {
              flushWysiwyg();
            }}
          />
        </>
      ) : (
        <textarea
          ref={textareaRef}
          defaultValue={value}
          onChange={(e) => onChange(e.target.value)}
          className="bmf-input"
          style={{ minHeight }}
          placeholder={placeholder}
        />
      )}
    </div>
  );
});

export default RichEditor;
