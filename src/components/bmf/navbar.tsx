"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export interface NavUser {
  userid: number;
  username: string;
  usergroup: number;
  newmess: number;
}

interface MenuDef {
  label: string;
  href?: string;
  /** 小屏（<768px）隐藏该菜单项，避免导航栏溢出 */
  hideOnMobile?: boolean;
  items?: { label: string; href: string; badge?: number; divider?: boolean; style?: string }[];
}

/** 界面风格切换：写 cookie + 切换 html[data-bmf-style]，服务端在 layout 中读取同一 cookie */
function applyStyle(v: string) {
  document.cookie = `bmf_style=${encodeURIComponent(v)}; path=/; max-age=31536000`;
  if (v === "default") delete document.documentElement.dataset.bmfStyle;
  else document.documentElement.dataset.bmfStyle = v;
}

export default function Navbar({
  user,
  isAdmin,
  boardTitle,
}: {
  user: NavUser | null;
  isAdmin: boolean;
  boardTitle: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const leftMenus: MenuDef[] = [
    {
      label: "论坛信息",
      items: [
        { label: "查看新帖", href: "/search?new=1" },
        { label: "发帖排行", href: "/userlist?sort=posts" },
        { label: "会员列表", href: "/userlist" },
        { label: "Tags 标签", href: "/tags" },
        { label: "RSS 订阅", href: "/rss" },
        ...(user
          ? [
              { label: "我的主题", href: `/search?author=${encodeURIComponent(user.username)}` },
            ]
          : []),
      ],
    },
    {
      label: "界面风格",
      hideOnMobile: true,
      items: [
        { label: "经典蓝（默认）", href: "", style: "default" },
        { label: "青竹绿", href: "", style: "green" },
        { label: "枣红", href: "", style: "wine" },
      ],
    },
  ];
  if (isAdmin) leftMenus.push({ label: "管理", href: "/admin" });

  const userMenus: MenuDef[] = user
    ? [
        {
          label: "消息",
          items: [{ label: "短消息收件箱", href: "/messenger", badge: user.newmess }],
        },
        {
          label: user.username,
          items: [
            { label: "控制面板", href: "/usercp" },
            { label: "我的资料", href: `/profile/${user.userid}` },
            { label: "收藏夹", href: "/usercp?tab=favorites" },
            { label: "", href: "", divider: true },
            { label: "退出登录", href: "/api/auth/logout?r=1" },
          ],
        },
      ]
    : [
        { label: "登录", href: "/login" },
        { label: "注册", href: "/register" },
      ];

  return (
    <nav ref={ref} className="bmf-navbar fixed top-0 left-0 right-0 z-[1030] h-10">
      <div className="mx-auto flex h-full w-full items-center px-2 sm:px-4" style={{ maxWidth: 970 }}>
        <Link
          href="/"
          className="max-w-[140px] truncate px-2 py-1.5 font-bold text-white hover:!bg-transparent sm:max-w-none"
        >
          {boardTitle}
        </Link>
        <ul className="flex items-stretch text-[13px]">
          {leftMenus.map((m) =>
            m.href ? (
              <li key={m.label} className={m.hideOnMobile ? "hidden md:block" : undefined}>
                <Link className="block px-2 py-2 sm:px-3" href={m.href}>
                  {m.label}
                </Link>
              </li>
            ) : (
              <li key={m.label} className={m.hideOnMobile ? "hidden md:block" : undefined}>
                <DropDown
                  m={m}
                  open={open === m.label}
                  onToggle={() => setOpen(open === m.label ? null : m.label)}
                />
              </li>
            )
          )}
          <li>
            <Link className="block px-2 py-2 sm:px-3" href="/search">
              搜索
            </Link>
          </li>
          <li className="hidden md:block">
            <Link className="block px-3 py-2" href="/faq">
              帮助
            </Link>
          </li>
        </ul>
        <ul className="ml-auto flex items-stretch text-[13px]">
          {userMenus.map((m) =>
            m.href ? (
              <li key={m.label}>
                <Link className="block px-2 py-2 sm:px-3" href={m.href}>
                  {m.label}
                </Link>
              </li>
            ) : (
              <DropDown
                key={m.label}
                m={m}
                open={open === m.label}
                onToggle={() => setOpen(open === m.label ? null : m.label)}
              />
            )
          )}
        </ul>
      </div>
    </nav>
  );
}

function DropDown({ m, open, onToggle }: { m: MenuDef; open: boolean; onToggle: () => void }) {
  return (
    <li className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="block cursor-pointer px-3 py-2"
      >
        {m.label}
        {m.items?.some((i) => i.badge) ? (
          <strong className="ml-1 text-[#ffa500]">
            ({m.items.reduce((acc, i) => acc + (i.badge ?? 0), 0)})
          </strong>
        ) : null}
        <b className="ml-1 inline-block border-x-4 border-t-4 border-x-transparent border-t-[#bfbfbf] align-middle" />
      </button>
      {open && m.items ? (
        <ul className="absolute left-0 top-full z-[1040] min-w-[150px] border border-[#333] bg-white py-1 shadow-md">
          {m.items.map((it, idx) =>
            it.divider ? (
              <li key={idx} className="my-1 border-t border-[#e5e5e5]" />
            ) : it.style ? (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => {
                    applyStyle(it.style as string);
                    onToggle();
                  }}
                  className="block w-full cursor-pointer px-4 py-1.5 text-left text-[13px] !text-[#444] hover:!bg-[#f0f0f0] hover:!text-[#444]"
                >
                  {it.label}
                </button>
              </li>
            ) : (
              <li key={idx}>
                <Link
                  href={it.href}
                  onClick={onToggle}
                  className="block px-4 py-1.5 text-[13px] !text-[#444] hover:!bg-[#f0f0f0] hover:!text-[#444]"
                >
                  {it.label}
                  {it.badge ? <strong className="ml-1 text-[#ffa500]">({it.badge})</strong> : null}
                </Link>
              </li>
            )
          )}
        </ul>
      ) : null}
    </li>
  );
}
