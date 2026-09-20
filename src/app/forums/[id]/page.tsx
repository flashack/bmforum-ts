import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuth, touchOnline } from "@/lib/auth";
import { getForum, getForumList, getThreads, countThreads } from "@/lib/queries";
import NaviBar from "@/components/bmf/navi-bar";
import Pagination from "@/components/bmf/pagination";
import { fmtRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function ForumPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { id } = await params;
  const { p } = await searchParams;
  const fid = Number(id);
  if (!Number.isInteger(fid)) notFound();

  const auth = await getAuth();
  const forum = await getForum(fid);
  if (!forum || forum.type !== "forum") notFound();
  await touchOnline(auth, `/forums/${fid}`);

  const all = await getForumList();
  const categories = all.filter((x) => x.type === "category");
  const cat = categories.find((c) => c.id === forum.forum_cid);
  const siblings = all.filter((x) => x.type === "forum" && x.forum_cid === forum.forum_cid);

  const page = Math.max(1, Number(p) || 1);
  const total = await countThreads(fid);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const offset = (Math.min(page, pages) - 1) * PER_PAGE;
  const threads = await getThreads(fid, PER_PAGE, offset);

  const mods = forum.blad ? forum.blad.split(",").filter(Boolean) : [];

  return (
    <main>
      <NaviBar
        crumbs={[
          { name: "论坛首页", href: "/" },
          { name: cat?.bbsname ?? "版块" },
          { name: forum.bbsname },
        ]}
        right={
          <>
            版主：
            {mods.length > 0 ? (
              mods.map((m, i) => (
                <span key={m}>
                  {i > 0 && ", "}
                  <span className="text-[#0a7d32]">{m}</span>
                </span>
              ))
            ) : (
              <span>暂无</span>
            )}
          </>
        }
      />

      {/* 子版块 / 同级版块导航 */}
      {siblings.length > 1 && (
        <div className="bmf-table-box">
          <div className="bmf-table-header">
            <span>{cat?.bbsname} 下的版块</span>
          </div>
          <div className="bmf-row flex flex-wrap gap-4">
            {siblings.map((s) => (
              <Link key={s.id} href={`/forums/${s.id}`} className={s.id === fid ? "font-bold" : ""}>
                {s.bbsname}
                <span className="ml-1 text-xs text-[#999]">({s.topicnum})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 主题列表 */}
      <div className="bmf-table-box">
        <div className="bmf-table-header">
          <span>{forum.bbsname}</span>
          <span className="flex items-center gap-3 text-xs font-normal opacity-90">
            {auth.user ? (
              <Link href={`/post?forumid=${fid}`} className="bmf-btn bmf-btn-primary !py-0.5 !text-xs">
                发表新主题
              </Link>
            ) : (
              <Link href="/login" className="text-white underline">
                登录后发帖
              </Link>
            )}
          </span>
        </div>
        <div className="bmf-col-head flex">
          <span className="flex-1">主题</span>
          <span className="w-24 text-center">作者</span>
          <span className="w-14 text-center">回复</span>
          <span className="w-14 text-center">浏览</span>
          <span className="w-40 text-center">最后回复</span>
        </div>

        {threads.length === 0 ? (
          <div className="bmf-row text-center text-[#999]">本版块还没有主题，快来发布第一帖吧！</div>
        ) : (
          threads.map((t) => (
            <div key={t.tid} className="bmf-row flex items-center text-[13px]">
              <div className="flex min-w-0 flex-1 flex-col pr-3">
                <div className="flex items-center">
                  {t.toptype === 1 && <span className="bmf-new" style={{ background: "#e0871c" }}>置顶</span>}
                  {t.toptype === 2 && <span className="bmf-new" style={{ background: "#8a6d3b" }}>精华</span>}
                  {t.islock === 1 && <span className="bmf-new" style={{ background: "#999" }}>锁定</span>}
                  <Link href={`/topic/${t.tid}`} className="truncate">
                    {t.title}
                  </Link>
                  {t.ttagname && (
                    <span className="ml-2 hidden flex-shrink-0 text-xs text-[#3083be] md:inline">
                      [{t.ttagname}]
                    </span>
                  )}
                </div>
                {t.newdesc && (
                  <span className="mt-0.5 truncate text-xs text-[#999]">{t.newdesc}</span>
                )}
              </div>
              <div className="w-24 flex-shrink-0 truncate text-center text-xs">
                <Link href={`/profile/${t.authorid}`}>{t.author}</Link>
              </div>
              <div className="w-14 flex-shrink-0 text-center text-xs text-[#666]">{t.replys}</div>
              <div className="w-14 flex-shrink-0 text-center text-xs text-[#666]">{t.hits}</div>
              <div className="w-40 flex-shrink-0 text-center text-xs text-[#999]">
                {t.lastreply ? (
                  <>
                    {t.lastreply}
                    <br />
                    {fmtRelative(t.changetime)}
                  </>
                ) : (
                  fmtRelative(t.changetime)
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between">
        <Pagination total={total} page={page} pages={pages} baseHref={`/forums/${fid}?p=`} />
        <Link href="/" className="text-xs text-[#3083be]">
          « 返回论坛首页
        </Link>
      </div>
    </main>
  );
}
