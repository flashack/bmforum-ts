"use client";

import { useState } from "react";

/** 资料页好友操作（原版 profile.php：加为好友 / 加入黑名单） */
export default function ContactQuickActions({ username }: { username: string }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(type: number) {
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, type }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; message?: string };
      setMsg(data.ok ? data.message || "操作成功" : data.error || "操作失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-3">
      <button type="button" className="bmf-btn !py-0.5 !text-xs" onClick={() => add(0)} disabled={busy}>
        加为好友
      </button>
      <button type="button" className="bmf-btn !py-0.5 !text-xs" onClick={() => add(2)} disabled={busy}>
        加入黑名单
      </button>
      {msg && <span className="text-[#336699]">{msg}</span>}
    </span>
  );
}
