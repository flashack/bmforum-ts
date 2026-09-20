"use client";

import { useState } from "react";

/** 主题点赞按钮 */
export default function DiggButton({
  tid,
  initial,
  logged,
  canDigg,
}: {
  tid: number;
  initial: number;
  logged: boolean;
  canDigg: boolean;
}) {
  const [count, setCount] = useState(initial);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function digg() {
    setMsg("");
    if (!logged) {
      setMsg("请先登录");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/threads/${tid}/digg`, { method: "POST" });
      const data = (await res.json()) as { ok: boolean; diggcount?: number; error?: string };
      if (!data.ok) {
        setMsg(data.error || "操作失败");
        return;
      }
      if (typeof data.diggcount === "number") setCount(data.diggcount);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" className="bmf-digg" onClick={digg} disabled={busy} title={!canDigg && logged ? "当前用户组无权点赞" : "点赞"}>
        赞 {count}
      </button>
      {msg && <span className="text-[10px] text-[#cc3311]">{msg}</span>}
    </span>
  );
}
