"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MessageActions({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!confirm("确定删除该消息？")) return;
    setBusy(true);
    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "delete" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={del} disabled={busy} className="cursor-pointer text-xs text-[#cc3311] hover:underline">
      删除
    </button>
  );
}
