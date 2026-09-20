import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import NaviBar from "@/components/bmf/navi-bar";
import { fmtRelative, fmtTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "搜索" };

interface Hit {
  tid: number;
  forumid: number;
  ttitle: string;
  forumname: string;
  author: string;
  replys: number;
  hits: number;
  changetime: number;
  lastreply: string;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; author?: string; forum?: string; new?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const author = (sp.author ?? "").trim().slice(0, 24);
  const forumId = Number(sp.forum ?? 0) || 0;
  const showNew = sp.new === "1";

  const forums = await query<{ id: number; bbsname: string }>(
    "SELECT id, bbsname FROM forumdata WHERE type = 'forum' ORDER BY id"
  );

  let hits: Hit[] = [];
  let searched = false;
  const cond: string[] = ["t.ttrash != 1"];
  const params: (string | number)[] = [];

  if (q) {
    params.push(`%${q}%`);
    cond.push(`t.title ILIKE $${params.length}`);
  }
  if (author) {
    params.push(author);
    cond.push(`t.author = $${params.length}`);
  }
  if (forumId) {
    params.push(forumId);
    cond.push(`t.forumid = $${params.length}`);
  }
  searched = Boolean(q || author) || showNew;

  if (showNew && !q && !author) {
    // 查看新帖模式：取全部有效主题
    hits = await query<Hit>(
      `SELECT t.tid, t.forumid, t.title AS ttitle, fd.bbsname AS forumname, t.author,
              t.replys, t.hits, t.changetime, t.lastreply
       FROM threads t
       LEFT JOIN forumdata fd ON fd.id = t.forumid
       WHERE t.ttrash = 0
       ORDER BY t.changetime DESC
       LIMIT 50`
    );
  } else if (searched) {
    hits = await query<Hit>(
      `SELECT t.tid, t.forumid, t.title AS ttitle, fd.bbsname AS forumname, t.author,
              t.replys, t.hits, t.changetime, t.lastreply
       FROM threads t
       LEFT JOIN forumdata fd ON fd.id = t.forumid
       WHERE ${cond.join(" AND ")}
       ORDER BY t.changetime DESC
       LIMIT 50`,
      params
    );
  }

  const stats = await queryOne<{ threadnum: string; postsnum: string }>(
    "SELECT threadnum, postsnum FROM lastest LIMIT 1"
  );

  return (
    <main>
      <NaviBar crumbs={[{ name: "论坛首页", href: "/" }, { name: "搜索" }]} />

      <div className="bmf-table-box">
        <div className="bmf-table-header">搜索帖子</div>
        <form className="bmf-row flex flex-wrap items-end gap-3" method="get">
          <div>
            <span className="bmf-label">关键字（标题）</span>
            <input className="bmf-input !w-56" name="q" defaultValue={q} placeholder="输入关键字" />
          </div>
          <div>
            <span className="bmf-label">作者</span>
            <input className="bmf-input !w-32" name="author" defaultValue={author} placeholder="用户名" />
          </div>
          <div>
            <span className="bmf-label">版块</span>
            <select className="bmf-input !w-44" name="forum" defaultValue={String(forumId)}>
              <option value="0">全部版块</option>
              {forums.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.bbsname}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="bmf-btn bmf-btn-primary">
            搜索
          </button>
          <span className="pb-1.5 text-xs text-[#999]">数据库共有 {stats?.threadnum ?? 0} 主题 / {stats?.postsnum ?? 0} 帖子</span>
        </form>
      </div>

      {searched && (
        <div className="bmf-table-box">
          <div className="bmf-table-header">
            <span>搜索结果</span>
            <span className="text-xs font-normal">共 {hits.length} 条（最多显示 50 条）</span>
          </div>
          {hits.length === 0 ? (
            <div className="bmf-row text-center text-xs text-[#999]">没有找到匹配的主题，请调整关键字重试。</div>
          ) : (
            hits.map((h) => (
              <div key={h.tid} className="bmf-row">
                <div className="text-[13px]">
                  <Link href={`/topic/${h.tid}`} className="font-bold">
                    {h.ttitle}
                  </Link>
                </div>
                <div className="mt-1 text-xs text-[#999]">
                  版块：<Link href={`/forums/${h.forumid}`} className="text-[#3083be]">{h.forumname}</Link> · 作者：{h.author} · 回复 {h.replys} · 查看 {h.hits} · 最后回复{" "}
                  {h.lastreply || "-"}（{fmtRelative(h.changetime)}）
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
