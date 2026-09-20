"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/** 修改密码 */
export function PasswordForm() {
  const router = useRouter();
  const [oldpwd, setOld] = useState("");
  const [newpwd, setNew] = useState("");
  const [newpwd2, setNew2] = useState("");
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setMsg("");
    setOkMsg("");
    if (!oldpwd || !newpwd) return setMsg("请填写完整");
    if (newpwd !== newpwd2) return setMsg("两次输入的新密码不一致");
    if (newpwd.length < 6) return setMsg("新密码长度至少 6 位");
    setBusy(true);
    try {
      const res = await fetch("/api/usercp/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldpwd, newpwd }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) return setMsg(data.error || "修改失败");
      setOkMsg("密码修改成功");
      setOld("");
      setNew("");
      setNew2("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bmf-row">
      <div className="mx-auto grid w-full max-w-md gap-3">
        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
          <span className="bmf-label !mb-0 text-right">原密码</span>
          <input className="bmf-input" type="password" value={oldpwd} onChange={(e) => setOld(e.target.value)} />
        </div>
        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
          <span className="bmf-label !mb-0 text-right">新密码</span>
          <input className="bmf-input" type="password" value={newpwd} onChange={(e) => setNew(e.target.value)} />
        </div>
        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
          <span className="bmf-label !mb-0 text-right">确认新密码</span>
          <input className="bmf-input" type="password" value={newpwd2} onChange={(e) => setNew2(e.target.value)} />
        </div>
        {msg && <div className="text-xs text-[#cc3311]">{msg}</div>}
        {okMsg && <div className="text-xs text-[#0a7d32]">{okMsg}</div>}
        <div className="text-right">
          <button type="button" className="bmf-btn bmf-btn-primary" onClick={submit} disabled={busy}>
            {busy ? "提交中..." : "修改密码"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 上传头像 */
export function AvatarUpload({ current }: { current: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const file = fileRef.current?.files?.[0];
    setMsg("");
    if (!file) return setMsg("请先选择图片");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/usercp/avatar", { method: "POST", body: fd });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) return setMsg(data.error || "上传失败");
      setMsg("头像已更新");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bmf-row">
      <div className="mx-auto flex w-full max-w-md items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current && /^(https?:\/\/|\/)/.test(current) ? current : `/api/avatar/0`}
          alt="头像"
          width={70}
          height={70}
          className="border border-[#dddddd]"
        />
        <div className="flex-1">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="text-xs" />
          <div className="mt-2 flex items-center gap-2 text-xs">
            <button type="button" className="bmf-btn bmf-btn-primary !py-0.5" onClick={submit} disabled={busy}>
              {busy ? "上传中..." : "上传头像"}
            </button>
            <span className="text-[#999]">png/jpg/gif/webp，≤2MB</span>
          </div>
          {msg && <div className="mt-1 text-xs text-[#336699]">{msg}</div>}
        </div>
      </div>
    </div>
  );
}

interface ContactRow {
  username: string;
  userid: number | null;
  postamount: number | null;
  type?: number;
}

const CONTACT_GROUPS: [number, string][] = [
  [0, "好友"],
  [1, "特别关注"],
  [2, "黑名单"],
];

/** 好友/联系人管理（原版 friendlist.php：三组名单 + 快捷发消息 + 清空） */
export function ContactsManager() {
  const router = useRouter();
  const [list, setList] = useState<ContactRow[]>([]);
  const [input, setInput] = useState("");
  const [group, setGroup] = useState(0);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/contacts");
    const data = (await res.json()) as { ok: boolean; list?: ContactRow[] };
    if (data.ok && data.list) setList(data.list);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    setMsg("");
    if (!input.trim()) return;
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: input.trim(), type: group }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string; message?: string };
    if (!data.ok) return setMsg(data.error || "添加失败");
    setMsg(data.message || "添加成功");
    setInput("");
    load();
  }

  async function cleanAll() {
    if (!window.confirm("确定清空全部联系人名单吗？")) return;
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clean" }),
    });
    load();
  }

  async function remove(username: string) {
    if (!window.confirm(`确定将 ${username} 从名单中移除吗？`)) return;
    await fetch("/api/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    load();
  }

  return (
    <div className="bmf-row">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          className="bmf-input !w-56"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入用户名添加"
          maxLength={30}
        />
        <select
          className="bmf-tool-select"
          value={group}
          onChange={(e) => setGroup(Number(e.target.value))}
        >
          {CONTACT_GROUPS.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" className="bmf-btn bmf-btn-primary !py-1" onClick={add}>
          添加
        </button>
        <button type="button" className="bmf-btn !py-1" onClick={cleanAll}>
          清空名单
        </button>
      </div>
      {msg && <div className="mb-2 text-xs text-[#336699]">{msg}</div>}
      {!loaded ? (
        <div className="text-xs text-[#999]">加载中...</div>
      ) : list.length === 0 ? (
        <div className="text-xs text-[#999]">名单为空，先添加一个联系人吧。</div>
      ) : (
        CONTACT_GROUPS.map(([gv, gname]) => {
          const rows = list.filter((c) => (c.type ?? 0) === gv);
          if (rows.length === 0) return null;
          return (
            <div key={gv} className="mb-3">
              <div className="mb-1 border-b border-[#3083be] pb-0.5 text-xs font-bold text-[#3083be]">
                {gname}（{rows.length}）
              </div>
              <div className="grid gap-1">
                {rows.map((c) => (
                  <div key={c.username} className="flex items-center justify-between border-b border-[#f0f0f0] py-1 text-[13px]">
                    <span>
                      <a href={`/profile/${c.userid ?? 0}`} className="text-[#3083be]">
                        {c.username}
                      </a>
                      <span className="ml-2 text-xs text-[#999]">{c.postamount ?? 0} 帖</span>
                    </span>
                    <span className="flex gap-2 text-xs">
                      <a href={`/messenger?to=${encodeURIComponent(c.username)}`} className="text-[#3083be]">
                        发消息
                      </a>
                      <button type="button" className="text-[#cc3311]" onClick={() => remove(c.username)}>
                        移除
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/** 金钱转账 */
export function TransferForm({ money }: { money: number }) {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setMsg("");
    setOkMsg("");
    const n = Number(amount);
    if (!to.trim() || !Number.isInteger(n) || n <= 0) return setMsg("请填写收款人和有效金额");
    setBusy(true);
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), amount: n }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) return setMsg(data.error || "转账失败");
      setOkMsg(`已向 ${to.trim()} 转账 ${n} 金钱`);
      setTo("");
      setAmount("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bmf-row">
      <div className="mx-auto grid w-full max-w-md gap-3">
        <div className="text-xs text-[#666]">
          当前金钱余额：<b className="text-[#cc8800]">{money}</b>
        </div>
        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
          <span className="bmf-label !mb-0 text-right">收款用户</span>
          <input className="bmf-input" value={to} onChange={(e) => setTo(e.target.value)} maxLength={30} />
        </div>
        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
          <span className="bmf-label !mb-0 text-right">金额</span>
          <input
            className="bmf-input"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="正整数"
          />
        </div>
        {msg && <div className="text-xs text-[#cc3311]">{msg}</div>}
        {okMsg && <div className="text-xs text-[#0a7d32]">{okMsg}</div>}
        <div className="text-right">
          <button type="button" className="bmf-btn bmf-btn-primary" onClick={submit} disabled={busy}>
            {busy ? "转账中..." : "确认转账"}
          </button>
        </div>
      </div>
    </div>
  );
}
