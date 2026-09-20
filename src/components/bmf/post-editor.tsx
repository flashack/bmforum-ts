"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { parseBmbCode } from "@/lib/bmbcode";

export interface EditorForum {
  id: number;
  bbsname: string;
}

export default function PostEditor({
  forums,
  defaultForumId,
  replyTo,
  quoteTitle,
  quoteContent,
  quoteAuthor,
}: {
  forums: EditorForum[];
  defaultForumId?: number;
  replyTo?: number;
  quoteTitle?: string;
  quoteContent?: string;
  quoteAuthor?: string;
}) {
  const isReply = typeof replyTo === "number";
  const router = useRouter();
  const [forumid, setForumid] = useState<number>(defaultForumId ?? forums[0]?.id ?? 0);
  const [title, setTitle] = useState(quoteTitle ? `RE: ${quoteTitle}` : "");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState(
    quoteContent ? `[quote=${quoteAuthor ?? ""}]${quoteContent.slice(0, 500)}[/quote]\n` : ""
  );
  const [pollText, setPollText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  function insert(left: string, right = "") {
    const el = areaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = content.slice(0, start) + left + content.slice(start, end) + right + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + left.length;
      el.selectionEnd = end + left.length;
    });
  }

  async function submit() {
    setMsg("");
    if (!isReply && !forumid) {
      setMsg("请选择版块");
      return;
    }
    if (!isReply && !title.trim()) {
      setMsg("请填写标题");
      return;
    }
    if (!content.trim()) {
      setMsg("请填写内容");
      return;
    }
    setBusy(true);
    try {
      if (isReply && typeof replyTo === "number") {
        const res = await fetch(`/api/threads/${replyTo}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        const data = (await res.json()) as { ok: boolean; error?: string };
        if (!data.ok) {
          setMsg(data.error || "回复失败");
          return;
        }
        router.push(`/topic/${replyTo}`);
        router.refresh();
        return;
      }
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forumid,
          title,
          content,
          tags,
          pollOptions: pollText
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean),
        }),
      });
      const data = (await res.json()) as { ok: boolean; tid?: number; error?: string };
      if (!data.ok) {
        setMsg(data.error || "发布失败");
        return;
      }
      if (typeof data.tid === "number") router.push(`/topic/${data.tid}`);
    } finally {
      setBusy(false);
    }
  }

  const TOOLBAR: [string, string, string][] = [
    ["加粗", "[b]", "[/b]"],
    ["斜体", "[i]", "[/i]"],
    ["下划线", "[u]", "[/u]"],
    ["删除线", "[s]", "[/s]"],
    ["引用", "[quote]", "[/quote]"],
    ["代码", "[code]", "[/code]"],
    ["链接", "[url=https://]", "[/url]"],
    ["图片", "[img]", "[/img]"],
    ["列表", "[list=1][*]项", "[/list]"],
    ["居中", "[center]", "[/center]"],
    ["分割线", "[hr]", ""],
  ];

  return (
    <div className="bmf-table-box">
      <div className="bmf-table-header">
        <span>{isReply ? `回复主题：${quoteTitle ?? ""}` : "发表新主题"}</span>
      </div>
      <div className="bmf-row">
        <div className="grid gap-3">
          {!isReply && (
            <div className="grid grid-cols-[90px_1fr] items-center gap-2">
              <span className="bmf-label !mb-0 text-right">发表版块</span>
              <select className="bmf-input !w-64" value={forumid} onChange={(e) => setForumid(Number(e.target.value))}>
                {forums.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.bbsname}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!isReply && (
            <div className="grid grid-cols-[90px_1fr] items-center gap-2">
              <span className="bmf-label !mb-0 text-right">主题标题</span>
              <input
                className="bmf-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入主题标题（必填）"
                maxLength={100}
              />
            </div>
          )}
          {!isReply && (
            <div className="grid grid-cols-[90px_1fr] items-center gap-2">
              <span className="bmf-label !mb-0 text-right">Tags 标签</span>
              <input
                className="bmf-input"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="用逗号或空格分隔，最多 5 个，如：PostgreSQL, 复刻"
              />
            </div>
          )}
          <div className="grid grid-cols-[90px_1fr] items-start gap-2">
            <span className="bmf-label !mb-0 pt-2 text-right">帖子内容</span>
            <div>
              <div className="mb-1 flex flex-wrap gap-1">
                {TOOLBAR.map(([label, l, r]) => (
                  <button key={label} type="button" className="bmf-btn !py-0.5 !text-xs" onClick={() => insert(l, r)}>
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  className="bmf-btn !py-0.5 !text-xs"
                  onClick={() => insert("[color=red]", "[/color]")}
                >
                  红色
                </button>
                <button
                  type="button"
                  className="bmf-btn !py-0.5 !text-xs"
                  onClick={() => insert("[size=4]", "[/size]")}
                >
                  大字
                </button>
              </div>
              <textarea
                ref={areaRef}
                className="bmf-input font-sans"
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="支持 BMBCode：[b]加粗[/b] [i]斜体[/i] [quote]引用[/quote] [code]代码[/code] [img]图片[/img] [url=https://...]链接[/url] [color=red]红色[/color] [list=1][*]列表[/list]"
              />
              <div className="mt-1 flex gap-2 text-xs">
                <button type="button" className="bmf-btn !py-0.5" onClick={() => setPreview(!preview)}>
                  {preview ? "关闭预览" : "预览内容"}
                </button>
              </div>
              {preview && (
                <div
                  className="bmf-article mt-2 border border-[#dddddd] bg-[#fbfbfb] p-3"
                  dangerouslySetInnerHTML={{ __html: parseBmbCode(content) }}
                />
              )}
            </div>
          </div>
          {!isReply && (
            <div className="grid grid-cols-[90px_1fr] items-start gap-2">
              <span className="bmf-label !mb-0 text-right">发起投票</span>
              <textarea
                className="bmf-input font-sans"
                rows={3}
                value={pollText}
                onChange={(e) => setPollText(e.target.value)}
                placeholder={"可选。每行一个投票选项（至少 2 行）发起投票，如：\nDiscuz!\nPHPWind\nBMForum"}
              />
            </div>
          )}
          {msg && <div className="text-xs text-[#cc3311]">{msg}</div>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#999]">发布后自动跳转到新主题</span>
            <button type="button" onClick={submit} disabled={busy} className="bmf-btn bmf-btn-primary">
              {busy ? "发布中..." : isReply ? "回复主题" : "发表主题"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
