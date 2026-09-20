import Link from "next/link";
import { query } from "@/lib/db";
import NaviBar from "@/components/bmf/navi-bar";
import { fmtRelative } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "主题随意贴" };

export default async function TagsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const sp = await searchParams;
  const tagId = Number(sp.id ?? 0) || 0;

  const tags = await query<{ tagid: number; tagname: string; threads: number }>(
    "SELECT tagid, tagname, threads FROM tags WHERE threads > 0 ORDER BY threads DESC LIMIT 100"
  );

  const topics = tagId
    ? await query<{ tid: number; title: string; author: string; replys: number; changetime: number }>(
        `SELECT t.tid, t.title, t.author, t.replys, t.changetime
         FROM threads t
         JOIN thread_tags tt ON tt.tid = t.tid
         WHERE tt.tagid = $1 AND t.ttrash != 1
         ORDER BY t.changetime DESC LIMIT 100`,
        [tagId]
      )
    : [];

  const current = tags.find((t) => t.tagid === tagId);

  return (
    <main>
      <NaviBar crumbs={[{ name: "论坛首页", href: "/" }, { name: "主题随意贴" }]} />

      <div className="bmf-table-box">
        <div className="bmf-table-header">
          <span>热门随意贴</span>
          <span className="text-xs font-normal">点击标签查看相关主题</span>
        </div>
        <div className="bmf-row flex flex-wrap items-baseline gap-x-4 gap-y-2">
          {tags.length === 0 && <span className="text-xs text-[#999]">暂无标签</span>}
          {tags.map((t) => {
            const size = t.threads >= 6 ? 22 : t.threads >= 3 ? 18 : 14;
            return (
              <Link
                key={t.tagid}
                href={`/tags?id=${t.tagid}`}
                style={{ fontSize: size }}
                className={t.tagid === tagId ? "font-bold text-[#cc3311]" : "text-[#3083be] hover:underline"}
              >
                {t.tagname}
                <sup className="text-[10px] text-[#999]">{t.threads}</sup>
              </Link>
            );
          })}
        </div>
      </div>

      {tagId > 0 && current && (
        <div className="bmf-table-box">
          <div className="bmf-table-header">
            <span>
              标签「{current.tagname}」的主题
            </span>
            <Link href="/tags" className="text-xs font-normal">
              返回全部标签 »
            </Link>
          </div>
          {topics.length === 0 ? (
            <div className="bmf-row text-center text-xs text-[#999]">该标签下暂无主题。</div>
          ) : (
            topics.map((t) => (
              <div key={t.tid} className="bmf-row flex items-center text-[13px]">
                <span className="flex-1 truncate">
                  <Link href={`/topic/${t.tid}`}>{t.title}</Link>
                </span>
                <span className="w-24 flex-shrink-0 text-xs text-[#666]">{t.author}</span>
                <span className="w-16 flex-shrink-0 text-center text-xs text-[#999]">{t.replys} 回复</span>
                <span className="w-28 flex-shrink-0 text-right text-xs text-[#999]">{fmtRelative(t.changetime)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
