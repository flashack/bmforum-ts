"use client";

import { useState } from "react";
import Link from "next/link";

/** 举报按钮 + 弹出表单（复刻原版 report.php：向版主报告此帖子） */
export default function ReportButton({ pid, logged }: { pid: number; logged: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!logged) {
    return (
      <Link href="/login" className="text-[#3083be]">
        举报
      </Link>
    );
  }

  async function submit() {
    setMsg("");
    if (!reason.trim()) {
      setMsg("请填写举报理由");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid, reason }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string; error?: string };
      if (data.ok) {
        setOpen(false);
        setReason("");
        alert(data.message || "举报已提交");
      } else {
        setMsg(data.error || "举报失败");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="relative">
      <button type="button" className="text-[#3083be]" onClick={() => setOpen((v) => !v)}>
        举报
      </button>
      {open && (
        <div className="absolute right-0 top-5 z-20 w-64 border border-[#dddddd] bg-white p-3 text-left shadow-md">
          <div className="mb-1 font-bold">向版主报告此帖子</div>
          <div className="mb-2 text-[11px] text-[#999]">程序会自动发送此帖子的链接和标题。</div>
          <textarea
            className="bmf-input !h-20 w-full !text-xs"
            placeholder="请详细描述您的报告理由"
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
          />
          {msg && <div className="mt-1 text-[11px] text-[#cc0000]">{msg}</div>}
          <div className="mt-2 flex gap-2">
            <button type="button" className="bmf-btn !py-0.5 !text-xs" disabled={busy} onClick={submit}>
              提交报告
            </button>
            <button type="button" className="bmf-btn !py-0.5 !text-xs" onClick={() => setOpen(false)}>
              取消
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
