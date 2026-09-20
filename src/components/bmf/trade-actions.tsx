"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 交易按钮事件委托组件（挂在主题页一次）
 * 处理由 parseBmbCode 渲染出的 data-trade 按钮：购买/退款/礼金/捐助
 */
export default function TradeActions({ logged }: { logged: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!logged) return;
    const handler = async (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-trade]") as HTMLElement | null;
      if (!el) return;
      const kind = el.dataset.trade;
      const pid = Number(el.dataset.pid);
      if (!kind || !Number.isInteger(pid)) return;

      let begmoney: number | undefined;
      if (kind === "buy" && !confirm("确定购买此内容吗？确认后将支付相应金钱。")) return;
      if (kind === "refund" && !confirm("确定要退款吗？所有买家已支付的金钱将如数退回。")) return;
      if (kind === "gift" && !confirm("您真的要将礼金发给该用户吗？")) return;
      if (kind === "beg") {
        const input = document.querySelector<HTMLInputElement>(`.bmf-beg-input[data-pid="${pid}"]`);
        const val = Number(input?.value ?? 0);
        if (!Number.isInteger(val) || val <= 0) {
          alert("请输入正确的捐助金额（正整数）");
          return;
        }
        if (!confirm("您真的要捐助帖子作者？")) return;
        begmoney = val;
      }

      el.setAttribute("disabled", "disabled");
      try {
        const res = await fetch(`/api/posts/${pid}/trade`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: kind, begmoney }),
        });
        const data = (await res.json()) as { ok: boolean; message?: string; error?: string };
        alert(data.ok ? data.message || "操作成功" : data.error || "操作失败");
        if (data.ok) router.refresh();
        else el.removeAttribute("disabled");
      } catch {
        alert("网络错误，请稍后再试");
        el.removeAttribute("disabled");
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [logged, router]);

  return null;
}
