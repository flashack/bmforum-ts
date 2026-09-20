"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ACTIONS: { key: string; label: string }[] = [
  { key: "digest", label: "加精/取消" },
  { key: "lock", label: "锁定/解锁" },
  { key: "front", label: "提前" },
];

export default function TopicTools({ tid, forumid }: { tid: number; forumid: number }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function act(action: string, forumId?: number, level?: number) {
    setBusy(true);
    try {
      const res = await fetch(`/api/threads/${tid}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, forumid: forumId, level }),
      });
      const data = (await res.json()) as { ok: boolean; deleted?: boolean; trashed?: boolean; error?: string };
      if (!data.ok) {
        alert(data.error || "操作失败");
        return;
      }
      if (data.deleted || data.trashed) router.push(`/forums/${forumid}`);
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function sticky() {
    const input = window.prompt(
      "设置置顶级别（原版分区置顶）：\n0 - 取消置顶\n1 - 本版置顶\n2 - 分类置顶\n3 - 全局置顶",
      "1"
    );
    if (input === null) return;
    const level = parseInt(input, 10);
    if (Number.isNaN(level) || level < 0 || level > 3) {
      alert("请输入 0~3 之间的整数");
      return;
    }
    void act("sticky", undefined, level);
  }

  return (
    <span className="flex items-center gap-2">
      <button
        key="sticky"
        type="button"
        disabled={busy}
        onClick={sticky}
        className="cursor-pointer hover:underline disabled:opacity-60"
      >
        置顶
      </button>
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
          if (confirm("确定将该主题移入回收站？管理员可在后台还原。")) act("trash");
        }}
        className="cursor-pointer text-[#ffdddd] hover:underline disabled:opacity-60"
      >
        回收站
      </button>
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
