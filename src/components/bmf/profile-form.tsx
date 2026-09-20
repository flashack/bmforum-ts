"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface UsercpProfile {
  mailadd: string;
  homepage: string;
  fromwhere: string;
  signtext: string;
  avatar: string;
  sex: string;
  birthday: string;
}

export default function ProfileForm({ profile }: { profile: UsercpProfile }) {
  const router = useRouter();
  const [form, setForm] = useState(profile);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof UsercpProfile>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/usercp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setMsg(data.error || "保存失败");
        setOk(false);
        return;
      }
      setOk(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bmf-row grid gap-3 text-[13px]">
      <div className="grid grid-cols-[90px_1fr] items-center gap-2">
        <span className="bmf-label !mb-0 text-right">电子邮箱</span>
        <input className="bmf-input !w-72" value={form.mailadd} onChange={(e) => set("mailadd", e.target.value)} />
      </div>
      <div className="grid grid-cols-[90px_1fr] items-center gap-2">
        <span className="bmf-label !mb-0 text-right">个人主页</span>
        <input
          className="bmf-input !w-72"
          value={form.homepage}
          onChange={(e) => set("homepage", e.target.value)}
          placeholder="https://"
        />
      </div>
      <div className="grid grid-cols-[90px_1fr] items-center gap-2">
        <span className="bmf-label !mb-0 text-right">来自</span>
        <input className="bmf-input !w-72" value={form.fromwhere} onChange={(e) => set("fromwhere", e.target.value)} />
      </div>
      <div className="grid grid-cols-[90px_1fr] items-center gap-2">
        <span className="bmf-label !mb-0 text-right">性别</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-1">
            <input type="radio" name="sex" checked={form.sex === "男"} onChange={() => set("sex", "男")} /> 男
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name="sex" checked={form.sex === "女"} onChange={() => set("sex", "女")} /> 女
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name="sex" checked={form.sex !== "男" && form.sex !== "女"} onChange={() => set("sex", "")} /> 保密
          </label>
        </div>
      </div>
      <div className="grid grid-cols-[90px_1fr] items-center gap-2">
        <span className="bmf-label !mb-0 text-right">生日</span>
        <input
          className="bmf-input !w-40"
          type="date"
          value={form.birthday}
          onChange={(e) => set("birthday", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-[90px_1fr] items-start gap-2">
        <span className="bmf-label !mb-0 pt-2 text-right">头像地址</span>
        <div>
          <input className="bmf-input !w-72" value={form.avatar} onChange={(e) => set("avatar", e.target.value)} placeholder="留空使用系统自动生成头像" />
          <p className="mt-1 text-xs text-[#999]">可填写图片地址（http(s):// 开头），留空则按用户名自动生成经典色块头像。</p>
        </div>
      </div>
      <div className="grid grid-cols-[90px_1fr] items-start gap-2">
        <span className="bmf-label !mb-0 pt-2 text-right">个性签名</span>
        <textarea className="bmf-input font-sans" rows={4} value={form.signtext} onChange={(e) => set("signtext", e.target.value)} />
      </div>
      {msg && <div className="text-xs text-[#cc3311]">{msg}</div>}
      {ok && <div className="text-xs text-[#3a7f2a]">资料已保存。</div>}
      <div className="text-right">
        <button type="submit" disabled={busy} className="bmf-btn bmf-btn-primary disabled:opacity-60">
          {busy ? "保存中..." : "保存修改"}
        </button>
      </div>
    </form>
  );
}
