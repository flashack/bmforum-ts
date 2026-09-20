import Link from "next/link";
import { getAuth, touchOnline, getOnlineStats } from "@/lib/auth";
import { getForumList, getSiteStats, getAnnounces, getHotTags, getSiteConfig } from "@/lib/queries";
import NaviBar from "@/components/bmf/navi-bar";
import { fmtRelative, fmtNumber, groupName, groupColor } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [auth, config, forums, stats, announces, tags, online] = await Promise.all([
    getAuth(),
    getSiteConfig(),
    getForumList(),
    getSiteStats(),
    getAnnounces(),
    getHotTags(18),
    getOnlineStats(),
  ]);
  await touchOnline(auth, "/");

  const categories = forums.filter((f) => f.type === "category");
  const forumMap = new Map<number, typeof forums>();
  for (const f of forums.filter((x) => x.type === "forum")) {
    if (!forumMap.has(f.forum_cid)) forumMap.set(f.forum_cid, []);
    forumMap.get(f.forum_cid)!.push(f);
  }
  const dayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);

  return (
    <main>
      {/* 原版 navi_bar：欢迎栏 + 统计 */}
      <div className="bmf-navi flex flex-wrap items-center justify-between gap-2">
        <div>
          欢迎您，
          {auth.user ? (
            <>
              <b style={{ color: groupColor(auth.user.usergroup) }}>{auth.user.username}</b>
              <span className="ml-2 text-xs">
                [ <Link href="/usercp">控制面板</Link> ]
                [ <Link href="/messenger">短消息{auth.user.newmess > 0 ? `(${auth.user.newmess})` : ""}</Link> ]
                {auth.isAdmin ? (
                  <>
                    {" "}
                    [ <Link href="/admin">管理</Link> ]
                  </>
                ) : null}
              </span>
            </>
          ) : (
            <>
              <b>游客</b>
              <span className="ml-2 text-xs">
                [ <Link href="/login">请登录</Link> ] [ <Link href="/register">立即注册</Link> ]
              </span>
            </>
          )}
        </div>
        <div className="text-xs">
          今日新帖 <b className="text-[#cc3311]">{stats.todaynew}</b> · 最高纪录{" "}
          <b>{stats.maxnews}</b> · 帖子总数 <b>{fmtNumber(stats.postsnum)}</b> · 会员总数{" "}
          <b>{fmtNumber(stats.regednum)}</b>
        </div>
      </div>

      <NaviBar crumbs={[{ name: "论坛首页" }]} right={config.description} />

      {/* 公告 */}
      {announces.length > 0 && (
        <div className="bmf-table-box">
          <div className="bmf-table-header">
            <span>论坛公告</span>
            <span className="text-xs font-normal opacity-80">Announcement</span>
          </div>
          {announces.map((a, i) => (
            <div key={a.id} className={i === announces.length - 1 ? "bmf-row" : "bmf-row border-b"}>
              <span className="bmf-new">公告</span>
              {a.url ? (
                <Link href={a.url} className="font-medium">
                  {a.title}
                </Link>
              ) : (
                <span className="font-medium">{a.title}</span>
              )}
              <span className="ml-2 text-xs text-[#999]">
                {a.author} · {fmtRelative(a.addtime)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 热门标签 */}
      {tags.length > 0 && (
        <div className="bmf-table-box">
          <div className="bmf-table-header">
            <span>热门标签</span>
            <Link href="/tags" className="text-xs font-normal opacity-90">
              全部标签 »
            </Link>
          </div>
          <div className="bmf-row flex flex-wrap items-center gap-x-3 gap-y-2">
            {tags.map((t) => (
              <Link key={t.tagid} href={`/tags?id=${t.tagid}`} style={{ fontSize: t.size }} className="text-[#336699]">
                {t.tagname}
                <span className="ml-0.5 text-xs text-[#999]">({t.threads})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 分类与版块 */}
      {categories.map((cat) => {
        const list = forumMap.get(cat.id) ?? [];
        return (
          <div key={cat.id} className="bmf-table-box">
            <div className="bmf-table-header">
              <span>{cat.bbsname}</span>
              <span className="text-xs font-normal opacity-80">{cat.cdes}</span>
            </div>
            <div className="bmf-col-head flex">
              <span className="flex-1">论坛</span>
              <span className="w-16 text-center">主题</span>
              <span className="w-16 text-center">回复</span>
              <span className="w-56 text-center">最后发表</span>
            </div>
            {list.map((f) => {
              const mods = f.blad ? f.blad.split(",").filter(Boolean) : [];
              const isNew = f.flposttime >= dayStart;
              return (
                <div key={f.id} className="bmf-row flex items-center">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center">
                      <span
                        className="mr-2 inline-block h-[14px] w-[14px] flex-shrink-0 rounded-[2px]"
                        style={{ background: isNew ? "#3083be" : "#c9d7e4" }}
                        title={isNew ? "有新帖" : "无新帖"}
                      />
                      <Link href={`/forums/${f.id}`} className="text-[14px] font-medium">
                        {f.bbsname}
                      </Link>
                    </div>
                    <div className="mt-0.5 pl-[22px] text-xs text-[#999]">
                      {f.cdes}
                      {mods.length > 0 && (
                        <span className="ml-2">
                          版主：
                          {mods.map((m, i) => (
                            <span key={m}>
                              {i > 0 && ", "}
                              <span className="text-[#0a7d32]">{m}</span>
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-16 text-center text-[#666]">{f.topicnum}</div>
                  <div className="w-16 text-center text-[#666]">{f.replysnum}</div>
                  <div className="w-56 text-center text-xs text-[#666]">
                    {f.fltitle ? (
                      <>
                        <Link href={`/forums/${f.id}`} className="block truncate text-[#3083be]" title={f.fltitle}>
                          {f.fltitle}
                        </Link>
                        <span className="text-[#999]">
                          {f.flposter} · {fmtRelative(f.flposttime)}
                        </span>
                      </>
                    ) : (
                      <span className="text-[#bbb]">暂无帖子</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* 在线用户 */}
      <div className="bmf-table-box">
        <div className="bmf-table-header">
          <span>
            在线用户 - 共 {online.members + online.guests} 人在线
            <span className="ml-2 text-xs font-normal opacity-80">
              {online.members} 位会员，{online.guests} 位游客
            </span>
          </span>
          <span className="text-xs font-normal opacity-80">15 分钟内活动</span>
        </div>
        <div className="bmf-row text-xs">
          {online.list.length > 0 ? (
            online.list.map((u) => (
              <span key={u.onusrid} className="mr-3">
                <Link href={`/profile/${u.onusrid}`} style={{ color: groupColor(u.ugnum) }}>
                  {u.username}
                </Link>
                <span className="ml-1 text-[#aaa]">({groupName(u.ugnum)})</span>
              </span>
            ))
          ) : (
            <span className="text-[#999]">当前没有会员在线</span>
          )}
        </div>
      </div>
    </main>
  );
}
