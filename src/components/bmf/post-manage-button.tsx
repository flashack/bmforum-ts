"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** 单帖管理按钮（版主）：回收/删除/恢复（原版 manage2.php） */
export default function PostManageButton({
  pid,
  tid,
  action,
  label,
}: {
  pid: number;
  tid: number;
  action: "trash" | "del" | "recover";
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go() {
    const tip =
      action === "del" ? `确定永久删除帖子 #${pid} 吗？此操作不可恢复！`
      : action === "trash" ? `确定将帖子 #${pid} 放入回收站吗？`
      : `确定恢复帖子 #${pid} 吗？`;
    if (!window.confirm(tip)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${pid}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        window.alert(data.error || "操作失败");
        return;
      }
      router.refresh();
      void tid;
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={go} disabled={busy} className="text-[#cc3311]">
      {busy ? "..." : label}
    </button>
  );
}
