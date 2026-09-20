"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReplyBox({
  tid,
  forumid,
  logged,
  locked,
}: {
  tid: number;
  forumid: number;
  logged: boolean;
  locked: boolean;
}) {
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (!logged) {
    return (
      <div className="bmf-table-box">
        <div className="bmf-table-header">快速回复</div>
        <div className="bmf-row text-center">
          <span className="text-[#666]">
            您需要 <a href="/login">登录</a> 后才能回复主题，还没有账号？<a href="/register">立即注册</a>
          </span>
        </div>
      </div>
    );
  }
  if (locked) {
    return (
      <div className="bmf-table-box">
        <div className="bmf-table-header">快速回复</div>
        <div className="bmf-row text-center text-[#999]">本主题已被锁定，无法回复</div>
      </div>
    );
  }

  async function submit() {
    if (!content.trim()) {
      setMsg("请填写回复内容");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/threads/${tid}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setMsg(data.error || "回复失败");
        return;
      }
      setContent("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function wrap(tag: string, close = true) {
    setContent((c) => `${c}[${tag}]${close ? `[/${tag}]` : ""}`);
  }

  return (
    <div className="bmf-table-box">
      <div className="bmf-table-header">快速回复</div>
      <div className="bmf-row">
        <div className="mb-2 flex flex-wrap gap-1 text-xs">
          {[
            ["b", "B 加粗"],
            ["i", "I 斜体"],
            ["u", "U 下划线"],
            ["quote", "引用"],
            ["code", "代码"],
            ["url", "链接"],
            ["img", "图片"],
          ].map(([tag, label]) => (
            <button key={tag} type="button" onClick={() => wrap(tag)} className="bmf-btn !py-0.5 !text-xs">
              {label}
            </button>
          ))}
        </div>
        <textarea
          className="bmf-input font-sans"
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="使用 BMBCode 语法，例如 [b]加粗[/b]、[quote]引用[/quote]"
        />
        {msg && <div className="mt-1 text-xs text-[#cc3311]">{msg}</div>}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-[#999]">回复后跳转到主题页</span>
          <button type="button" onClick={submit} disabled={busy} className="bmf-btn bmf-btn-primary disabled:opacity-60">
            {busy ? "发布中..." : "回复主题"}
          </button>
        </div>
      </div>
    </div>
  );
}
