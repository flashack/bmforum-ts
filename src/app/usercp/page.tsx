import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import NaviBar from "@/components/bmf/navi-bar";
import ProfileForm from "@/components/bmf/profile-form";
import { PasswordForm, AvatarUpload, ContactsManager, TransferForm } from "@/components/bmf/usercp-extras";
import { fmtTime, fmtRelative } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "控制面板" };

interface FavRow {
  tid: number;
  owner: string;
  ttitle: string;
  forumname: string;
  lastreply: number;
  changetime: number;
}

export default async function UsercpPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const auth = await getAuth();
  if (!auth.user) redirect("/login");
  const sp = await searchParams;
  const tab = sp.tab ?? "profile";

  const favs =
    tab === "favorites"
      ? await query<FavRow>(
          `SELECT f.tid, f.owner, t.title AS ttitle, fd.bbsname AS forumname,
                  t.lastreply, t.changetime
           FROM favorites f
           LEFT JOIN threads t ON t.tid = f.tid
           LEFT JOIN forumdata fd ON fd.id = t.forumid
           WHERE f.owner = $1
           ORDER BY f.tid DESC
           LIMIT 100`,
          [auth.user.userid]
        )
      : [];

  const myPosts =
    tab === "posts"
      ? await query<{ tid: number; content: string; timestamp: number; ttitle: string }>(
          `SELECT p.tid, p.content, p.timestamp, t.title AS ttitle
           FROM posts p LEFT JOIN threads t ON t.tid = p.tid
           WHERE p.usrid = $1 ORDER BY p.timestamp DESC LIMIT 20`,
          [auth.user.userid]
        )
      : [];

  const TABS: [string, string][] = [
    ["profile", "编辑个人资料"],
    ["avatar", "头像"],
    ["contacts", "好友/联系人"],
    ["account", "账户安全"],
    ["favorites", `我的收藏`],
    ["posts", "我的帖子"],
  ];

  return (
    <main>
      <NaviBar crumbs={[{ name: "论坛首页", href: "/" }, { name: "控制面板" }]} />

      <div className="bmf-table-box">
        <div className="bmf-table-header">
          <span>用户控制面板</span>
          <Link href={`/profile/${auth.user.userid}`} className="text-xs font-normal">
            查看我的公开资料 »
          </Link>
        </div>
        <div className="bmf-col-head flex gap-4">
          {TABS.map(([key, label]) => (
            <Link key={key} href={`/usercp?tab=${key}`} className={tab === key ? "font-bold text-[#3083be]" : ""}>
              {label}
            </Link>
          ))}
        </div>

        {tab === "profile" ? (
          <ProfileForm
            profile={{
              mailadd: auth.user.mailadd,
              homepage: auth.user.homepage,
              fromwhere: auth.user.fromwhere,
              signtext: auth.user.signtext,
              avatar: auth.user.avatar,
              sex: auth.user.sex,
              birthday: auth.user.birthday,
            }}
          />
        ) : tab === "avatar" ? (
          <AvatarUpload current={auth.user.avatar} />
        ) : tab === "contacts" ? (
          <ContactsManager />
        ) : tab === "account" ? (
          <div>
            <PasswordForm />
            <div className="h-2" />
            <TransferForm money={auth.user.money} />
          </div>
        ) : tab === "favorites" ? (
          favs.length === 0 ? (
            <div className="bmf-row text-center text-xs text-[#999]">暂无收藏。浏览主题时点击「收藏」按钮即可加入。</div>
          ) : (
            favs.map((f) => (
              <div key={f.tid} className="bmf-row flex items-center text-[13px]">
                <span className="flex-1 truncate">
                  <Link href={`/topic/${f.tid}`}>{f.ttitle ?? "[主题已删除]"}</Link>
                </span>
                <span className="w-32 flex-shrink-0 truncate text-xs text-[#666]">{f.forumname}</span>
                <span className="w-14 flex-shrink-0 text-center text-xs text-[#999]">{f.lastreply ?? 0} 回复</span>
                <span className="w-32 flex-shrink-0 text-right text-xs text-[#999]">{f.changetime ? fmtRelative(f.changetime) : "-"}</span>
              </div>
            ))
          )
        ) : myPosts.length === 0 ? (
          <div className="bmf-row text-center text-xs text-[#999]">还没有发表过帖子。</div>
        ) : (
          myPosts.map((p, i) => (
            <div key={i} className="bmf-row text-[13px]">
              <div className="mb-1 text-xs text-[#999]">
                <Link href={`/topic/${p.tid}`} className="font-bold text-[#3083be]">
                  {p.ttitle}
                </Link>
                · {fmtTime(p.timestamp)}
              </div>
              <div className="line-clamp-2 text-xs text-[#555]" style={{ whiteSpace: "pre-wrap" }}>
                {p.content.slice(0, 150)}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
