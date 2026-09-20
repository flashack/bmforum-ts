"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PollOption {
  text: string;
  votes: number;
}

export default function PollBox({
  poll,
  tid,
  canVote,
}: {
  poll: { options: PollOption[]; polluser: number[] | string; maxchoose: number };
  tid: number;
  canVote: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const raw = typeof poll.polluser === "string" ? JSON.parse(poll.polluser || "[]") : poll.polluser;
  const votedUsers: number[] = Array.isArray(raw) ? raw.map(Number) : [];
  const totalVotes = poll.options.reduce((acc, o) => acc + (o.votes || 0), 0);
  const maxChoose = poll.maxchoose || 1;

  function toggle(i: number) {
    if (!canVote) return;
    setSelected((sel) => {
      if (sel.includes(i)) return sel.filter((x) => x !== i);
      if (maxChoose === 1) return [i];
      return sel.length >= maxChoose ? sel : [...sel, i];
    });
  }

  async function submitVote() {
    if (selected.length === 0) {
      setMsg("请先选择选项");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/threads/${tid}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choices: selected }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setMsg(data.error || "投票失败");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bmf-row">
      <div className="mb-2 text-[13px] font-bold text-[#336699]">
        投票（{totalVotes} 票 · {maxChoose > 1 ? `最多选 ${maxChoose} 项` : "单选"}）
      </div>
      {poll.options.map((o, i) => {
        const pct = totalVotes > 0 ? Math.round(((o.votes || 0) / totalVotes) * 100) : 0;
        return (
          <div key={i} className="mb-2">
            <div className="flex items-center gap-2 text-[13px]">
              {canVote ? (
                <input
                  type={maxChoose > 1 ? "checkbox" : "radio"}
                  name={`poll_${tid}`}
                  checked={selected.includes(i)}
                  onChange={() => toggle(i)}
                  className="accent-[#3083be]"
                />
              ) : (
                <span className="inline-block h-2 w-2 rounded-full bg-[#3083be]" />
              )}
              <span className="min-w-[120px]">{o.text}</span>
              <span className="relative h-4 flex-1 overflow-hidden rounded-[2px] bg-[#eef4fa]">
                <span
                  className="absolute left-0 top-0 h-full bg-[#3083be]/70 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="w-24 text-right text-xs text-[#666]">
                {o.votes || 0} 票 ({pct}%)
              </span>
            </div>
          </div>
        );
      })}
      {canVote ? (
        <div className="mt-2 flex items-center gap-3">
          <button type="button" onClick={submitVote} disabled={busy} className="bmf-btn bmf-btn-primary !py-1 !text-xs">
            {busy ? "提交中..." : "投 票"}
          </button>
          {msg && <span className="text-xs text-[#cc3311]">{msg}</span>}
          <span className="text-xs text-[#999]">已投票人数：{new Set(votedUsers).size}</span>
        </div>
      ) : (
        <div className="mt-1 text-xs text-[#999]">已投票人数：{new Set(votedUsers).size}</div>
      )}
    </div>
  );
}
