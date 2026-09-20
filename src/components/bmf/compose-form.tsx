"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ComposeForm({ defaultTo }: { defaultTo?: string }) {
  const router = useRouter();
  const [sendto, setSendto] = useState(defaultTo ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendto, title, content }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setMsg(data.error || "发送失败");
        return;
      }
      router.push("/messenger?tab=outbox");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bmf-row grid gap-3">
      <div className="grid grid-cols-[80px_1fr] items-center gap-2">
        <span className="bmf-label !mb-0 text-right">收件人</span>
        <input className="bmf-input !w-64" value={sendto} onChange={(e) => setSendto(e.target.value)} />
      </div>
      <div className="grid grid-cols-[80px_1fr] items-center gap-2">
        <span className="bmf-label !mb-0 text-right">标题</span>
        <input
          className="bmf-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="消息标题"
        />
      </div>
      <div className="grid grid-cols-[80px_1fr] items-start gap-2">
        <span className="bmf-label !mb-0 pt-2 text-right">内容</span>
        <textarea className="bmf-input font-sans" rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      {msg && <div className="text-xs text-[#cc3311]">{msg}</div>}
      <div className="text-right">
        <button type="submit" disabled={busy} className="bmf-btn bmf-btn-primary disabled:opacity-60">
          {busy ? "发送中..." : "发送消息"}
        </button>
      </div>
    </form>
  );
}
