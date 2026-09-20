"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** 清空收件箱/发件箱（原版 messenger job=clear） */
export default function ClearBoxButton({ box }: { box: "inbox" | "outbox" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function clear() {
    if (!window.confirm(box === "inbox" ? "确定清空收件箱中的全部消息吗？此操作不可恢复！" : "确定清空发件箱中的全部消息吗？此操作不可恢复！")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear", box }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        window.alert(data.error || "清空失败");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={clear}
      disabled={busy}
      className="cursor-pointer text-xs text-[#cc3311] hover:underline disabled:opacity-60"
    >
      {busy ? "清空中..." : "清空信箱"}
    </button>
  );
}
