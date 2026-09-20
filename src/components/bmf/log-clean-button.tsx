"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** 版块日志清空（原版 forumlogs.php addon=clean，管理员） */
export default function LogCleanButton({ fid }: { fid: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function clean() {
    if (!window.confirm(`确定清空本版块全部日志吗？`)) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/forumlogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clean", fid }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) setMsg(data.error || "清空失败");
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex items-center gap-2 text-xs font-normal">
      {msg && <span className="text-[#cc3311]">{msg}</span>}
      <button type="button" className="bmf-btn !py-0.5 !text-xs" onClick={clean} disabled={busy}>
        清空本版日志
      </button>
      <a href={`/forums/${fid}`} className="text-xs">
        返回版块 »
      </a>
    </span>
  );
}
