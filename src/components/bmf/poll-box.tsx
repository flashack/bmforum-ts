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
  voted,
  viewerPostamount,
  voters,
}: {
  poll: {
    options: PollOption[];
    polluser: number[] | string;
    maxchoose: number;
    viewafter: number;
    minposts: number;
    deadline: number;
  };
  tid: number;
  canVote: boolean;
  voted: boolean;
  viewerPostamount: number;
  voters: { userid: number; username: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const raw = typeof poll.polluser === "string" ? JSON.parse(poll.polluser || "[]") : poll.polluser;
  const votedUsers: number[] = Array.isArray(raw) ? raw.map(Number) : [];
  const maxChoose = poll.maxchoose || 1;
  const now = Math.floor(Date.now() / 1000);
  const expired = poll.deadline > 0 && now > poll.deadline;
  const voterCount = new Set(votedUsers).size;
  const totalVotes = poll.options.reduce((acc, o) => acc + (o.votes || 0), 0);
  // 原版 viewafter：开启后未投票者看不到结果（只显示选项）
  const hideResult = poll.viewafter === 1 && !voted && !expired;
  const postsEnough = poll.minposts <= 0 || viewerPostamount >= poll.minposts;
  const canSubmit = canVote && !voted && !expired && postsEnough;

  function toggle(i: number) {
    if (!canSubmit) return;
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
        投票{maxChoose > 1 ? `（多选，最多选 ${maxChoose} 项）` : "（单选）"}
      </div>
      {poll.options.map((o, i) => {
        // 原版比例：得票 / 投票人数（多选时票数可大于人数）
        const rate = voterCount > 0 ? Math.round(((o.votes || 0) / voterCount) * 100) : 0;
        const barPct = totalVotes > 0 ? Math.floor(((o.votes || 0) / totalVotes) * 100) : 0;
        return (
          <div key={i} className="mb-2">
            <div className="flex items-center gap-2 text-[13px]">
              {canSubmit ? (
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
              <span className="min-w-[80px] md:min-w-[120px]">{o.text}</span>
              {hideResult ? null : (
                <>
                  <span className="relative h-4 min-w-[100px] flex-1 overflow-hidden rounded-[2px] bg-[#eef4fa]">
                    <span
                      className="absolute left-0 top-0 h-full bg-[#3083be]/70 transition-all"
                      style={{ width: `${barPct}%` }}
                    />
                  </span>
                  <span className="w-24 text-right text-xs text-[#666]">
                    {o.votes || 0} 票 ({rate}%)
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#666]">
        <span>
          参与人数 <strong className="text-[#336699]">{voterCount}</strong> 人
        </span>
        {voters.length > 0 && (
          <select className="bmf-input !w-auto !py-0.5 !text-xs" defaultValue="">
            <option value="">投票者名单</option>
            <option value="">------</option>
            {voters.map((v) => (
              <option key={v.userid} value={v.userid}>
                {v.username}
              </option>
            ))}
          </select>
        )}
        {poll.deadline > 0 && (
          <span>
            截止时间：
            {new Date(poll.deadline * 1000).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </span>
        )}
        {expired && <strong className="text-[#cc3311]">投票已截止</strong>}
        {voted && <strong className="text-[#336699]">* 您已投过票</strong>}
        {!postsEnough && (
          <strong className="text-[#cc3311]">发帖数需达到 {poll.minposts} 才能参与投票</strong>
        )}
      </div>
      {canSubmit && (
        <div className="mt-2 flex items-center gap-3">
          <button type="button" onClick={submitVote} disabled={busy} className="bmf-btn bmf-btn-primary !py-1 !text-xs">
            {busy ? "提交中..." : "投 一 票"}
          </button>
          {msg && <span className="text-xs text-[#cc3311]">{msg}</span>}
          {poll.viewafter === 1 && <span className="text-xs text-[#999]">* 投票后才能查看结果</span>}
        </div>
      )}
    </div>
  );
}
