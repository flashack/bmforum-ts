"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mailadd, setMailadd] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { username, password } : { username, password, mailadd }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setMsg(data.error || "操作失败");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md">
      <div className="bmf-table-box">
        <div className="bmf-table-header">{isLogin ? "会员登录" : "注册新会员"}</div>
        <div className="bmf-row grid gap-3">
          <div>
            <label className="bmf-label">用户名</label>
            <input
              className="bmf-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="bmf-label">密码{isLogin ? "" : "（至少 6 位）"}</label>
            <input
              className="bmf-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>
          {!isLogin && (
            <div>
              <label className="bmf-label">电子邮件（选填）</label>
              <input
                className="bmf-input"
                type="email"
                value={mailadd}
                onChange={(e) => setMailadd(e.target.value)}
                autoComplete="email"
              />
            </div>
          )}
          {msg && <div className="text-xs text-[#cc3311]">{msg}</div>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#999]">
              {isLogin ? (
                <>
                  还没有账号？<Link href="/register">立即注册</Link>
                </>
              ) : (
                <>
                  已有账号？<Link href="/login">直接登录</Link>
                </>
              )}
            </span>
            <button type="submit" disabled={busy} className="bmf-btn bmf-btn-primary disabled:opacity-60">
              {busy ? "提交中..." : isLogin ? "登 录" : "注 册"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
