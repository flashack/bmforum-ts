"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ACTIONS: { key: string; label: string }[] = [
  { key: "sticky", label: "置顶/取消" },
  { key: "digest", label: "加精/取消" },
  { key: "lock", label: "锁定/解锁" },
];

export default function TopicTools({ tid, forumid }: { tid: number; forumid: number }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function act(action: string, forumId?: number) {
    setBusy(true);
    try {
      const res = await fetch(`/api/threads/${tid}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, forumid: forumId }),
      });
      const data = (await res.json()) as { ok: boolean; deleted?: boolean; error?: string };
      if (!data.ok) {
        alert(data.error || "操作失败");
        return;
      }
      if (data.deleted) router.push(`/forums/${forumid}`);
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      {ACTIONS.map((a) => (
        <button
          key={a.key}
          type="button"
          disabled={busy}
          onClick={() => act(a.key)}
          className="cursor-pointer hover:underline disabled:opacity-60"
        >
          {a.label}
        </button>
      ))}
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (confirm("确定删除该主题？此操作不可恢复。")) act("delete");
        }}
        className="cursor-pointer text-[#ffdddd] hover:underline disabled:opacity-60"
      >
        删除
      </button>
    </span>
  );
}
