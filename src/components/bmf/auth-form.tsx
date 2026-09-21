"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mailadd, setMailadd] = useState("");
  const [invitecode, setInvitecode] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const loadCaptcha = useCallback(async () => {
    setCaptcha("");
    try {
      const res = await fetch("/api/captcha");
      const data = (await res.json()) as { ok: boolean; token?: string; svg?: string };
      if (data.ok && data.token && data.svg) {
        setCaptchaToken(data.token);
        setCaptchaSvg(data.svg);
      }
    } catch {
      setCaptchaSvg("");
    }
  }, []);

  useEffect(() => {
    if (!isLogin) void loadCaptcha();
  }, [isLogin, loadCaptcha]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLogin
            ? { username, password }
            : { username, password, mailadd, invitecode, captcha, captchaToken }
        ),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setMsg(data.error || "操作失败");
        if (!isLogin) void loadCaptcha();
        return;
      }
      // 全量跳转：确保服务端组件按最新 cookie 重新渲染登录态（避免客户端路由缓存）
      window.location.assign("/");
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
          {!isLogin && (
            <div>
              <label className="bmf-label">邀请码（若本站开启邀请注册则必填）</label>
              <input
                className="bmf-input"
                value={invitecode}
                onChange={(e) => setInvitecode(e.target.value)}
                placeholder="形如 BMF-XXXXXX"
                maxLength={32}
              />
            </div>
          )}
          {!isLogin && (
            <div>
              <label className="bmf-label">验证码（不区分大小写）</label>
              <div className="flex items-center gap-2">
                <input
                  className="bmf-input !w-32"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  maxLength={8}
                  autoComplete="off"
                />
                {captchaSvg ? (
                  <button
                    type="button"
                    className="flex-shrink-0 border border-[#dddddd] leading-none"
                    onClick={() => void loadCaptcha()}
                    title="看不清？点击换一张"
                    dangerouslySetInnerHTML={{ __html: captchaSvg }}
                  />
                ) : (
                  <span className="text-xs text-[#999]">验证码加载中...</span>
                )}
              </div>
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
