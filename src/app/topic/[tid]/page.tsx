import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuth, touchOnline } from "@/lib/auth";
import { getForum, getForumList } from "@/lib/queries";
import { query, queryOne, execute } from "@/lib/db";
import { parseBmbCode, type AttachInfo, type TradeCtx, type BegRow, type ViewerCtx } from "@/lib/bmbcode";
import NaviBar from "@/components/bmf/navi-bar";
import Pagination from "@/components/bmf/pagination";
import TopicTools from "@/components/bmf/topic-tools";
import ReplyBox from "@/components/bmf/reply-box";
import PollBox from "@/components/bmf/poll-box";
import FavoriteButton from "@/components/bmf/favorite-button";
import DiggButton from "@/components/bmf/digg-button";
import TradeActions from "@/components/bmf/trade-actions";
import ReportButton from "@/components/bmf/report-button";
import PostManageButton from "@/components/bmf/post-manage-button";
import { avatarUrl, fmtTime, fmtDate, groupName, groupColor } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PostRow {
  id: number;
  tid: number;
  articletitle: string;
  username: string;
  usrid: number;
  articlecontent: string;
  timestamp: number;
  changtime: number;
  sellbuyer: string;
  editinfo: string;
  ip: string;
}

interface AuthorInfo {
  userid: number;
  username: string;
  avatar: string;
  usergroup: number;
  headtitle: string;
  desper: string;
  postamount: number;
  point: number;
  money: number;
  regdate: string;
  signtext: string;
  fromwhere: string;
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ tid: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { tid: tidStr } = await params;
  const { p } = await searchParams;
  const tid = Number(tidStr);
  if (!Number.isInteger(tid)) notFound();

  const auth = await getAuth();
  const thread = await queryOne<{
    tid: number;
    forumid: number;
    toptype: number;
    title: string;
    author: string;
    authorid: number;
    time: number;
    hits: number;
    replys: number;
    islock: number;
    ttagname: string;
  }>(
    `SELECT tid, forumid, toptype, title, author, authorid, time, hits, replys, islock, ttagname
     FROM threads WHERE tid = $1 AND ttrash = 0`,
    [tid]
  );
  if (!thread) notFound();
  await touchOnline(auth, `/topic/${tid}`);
  await execute("UPDATE threads SET hits = hits + 1 WHERE tid = $1", [tid]);

  const forum = await getForum(thread.forumid);
  if (!forum) notFound();
  const all = await getForumList();
  const cat = all.find((c) => c.id === forum.forum_cid);

  // 后台可配每页回复数（原版 setoptions perpage）
  const perpageRow = await queryOne<{ value: string }>("SELECT value FROM bbs_config WHERE key = 'perpage'");
  const perpage = Math.min(Math.max(parseInt(perpageRow?.value ?? "10", 10) || 10, 5), 50);

  const total = thread.replys + 1;
  const pages = Math.max(1, Math.ceil(total / perpage));
  const page = Math.min(Math.max(1, Number(p) || 1), pages);
  const offset = (page - 1) * perpage;

  const posts = await query<PostRow>(
    `SELECT id, tid, articletitle, username, usrid, articlecontent, timestamp, changtime, sellbuyer, editinfo, ip
     FROM posts WHERE tid = $1 ORDER BY id LIMIT $2 OFFSET $3`,
    [tid, perpage, offset]
  );
  const usrids = [...new Set(posts.map((x) => x.usrid))];
  const authors = new Map<number, AuthorInfo>();
  if (usrids.length > 0) {
    const rows = await query<AuthorInfo>(
      `SELECT userid, username, avatar, usergroup, headtitle, desper, postamount, point, money,
              regdate, signtext, fromwhere
       FROM userlist WHERE userid = ANY($1)`,
      [usrids]
    );
    for (const r of rows) authors.set(r.userid, r);
  }

  const poll = await queryOne<{
    options: { text: string; votes: number }[];
    polluser: number[] | string;
    maxchoose: number;
    viewafter: number;
    minposts: number;
    deadline: number;
  }>("SELECT options, polluser, maxchoose, viewafter, minposts, deadline FROM polls WHERE tid = $1", [tid]);
  let pollVoters: { userid: number; username: string }[] = [];
  let pollVoted = false;
  if (poll) {
    const rawVoters = typeof poll.polluser === "string" ? JSON.parse(poll.polluser || "[]") : poll.polluser;
    const voterIds = Array.isArray(rawVoters) ? rawVoters.map(Number) : [];
    pollVoted = !!auth.user && voterIds.includes(auth.user.userid);
    if (voterIds.length > 0) {
      pollVoters = (await query<{ userid: number; username: string }>(
        "SELECT userid, username FROM userlist WHERE userid = ANY($1) ORDER BY userid",
        [voterIds]
      )).slice(0, 200);
    }
  }

  // 附件元数据（用于渲染 [attach=N]）
  const attachRows = await query<AttachInfo & { tid: number }>(
    "SELECT id, tid, filename, size, downloads FROM attachments WHERE tid = $1 ORDER BY id",
    [tid]
  );
  const attachMap = new Map<number, AttachInfo>();
  for (const a of attachRows) attachMap.set(a.id, a);

  const diggcount = await queryOne<{ diggcount: number }>(
    "SELECT diggcount FROM threads WHERE tid = $1",
    [tid]
  );

  const favorited = auth.user
    ? (await queryOne("SELECT id FROM favorites WHERE owner = $1 AND tid = $2", [auth.user.userid, tid])) !== null
    : false;

  const isMod = auth.isMod;
  const mods = forum.blad ? forum.blad.split(",").filter(Boolean) : [];
  const tags = thread.ttagname ? thread.ttagname.split(",").filter(Boolean) : [];

  // ===== 交易标签（出售/礼金/求赏）上下文装配 =====
  const firstPost = await queryOne<{ id: number; articlecontent: string; usrid: number }>(
    "SELECT id, articlecontent, usrid FROM posts WHERE tid = $1 ORDER BY id LIMIT 1",
    [tid]
  );
  const moneyRow = await queryOne<{ value: string }>("SELECT value FROM bbs_config WHERE key = 'moneyunit'");
  const moneyUnit = moneyRow?.value || "金钱";
  const parseMoney = (content: string, tag: "sell" | "gift"): number => {
    // 原版出售写作 [pay=金额]（post.php 包裹）或 [sell=金额]，二者同义
    const pattern = tag === "sell" ? "\\[(?:sell|pay)=(\\d{1,9})\\]" : `\\[${tag}=(\\d{1,9})\\]`;
    const m = content.match(new RegExp(pattern, "i"));
    return m ? parseInt(m[1], 10) : 0;
  };
  const begIds = posts.flatMap((p) => [`${p.id}1`, `${p.id}3`]).concat(`${tid}2`);
  const begRows = await query<BegRow & { id: string }>(
    "SELECT id, beglog, giftid, begers, begmoneys FROM beg WHERE id = ANY($1)",
    [begIds]
  );
  const begMap = new Map(begRows.map((r) => [r.id, r]));
  const giftMoney = firstPost ? parseMoney(firstPost.articlecontent, "gift") : 0;

  const threadAuthorId = thread.authorid;

  // 隐藏类标签（[post]/[hpost]/[hmoney]/[hide]）读者上下文
  const viewerHasReplied = auth.user
    ? (await queryOne<{ id: number }>(
        "SELECT id FROM posts WHERE tid = $1 AND usrid = $2 AND posttrash = 0 LIMIT 1",
        [tid, auth.user.userid]
      )) !== null
    : false;
  function buildViewerCtx(post: PostRow): ViewerCtx {
    return {
      logged: !!auth.user,
      privileged: isMod || auth.user?.userid === post.usrid,
      hasReplied: viewerHasReplied,
      postamount: auth.user?.postamount ?? 0,
      money: auth.user?.money ?? 0,
      point: auth.user?.point ?? 0,
    };
  }

  /** 为单个帖子构造 parseBmbCode 的交易上下文 */
  function buildTradeCtx(post: PostRow): TradeCtx | undefined {
    const sellMoney = parseMoney(post.articlecontent, "sell");
    const isBeg = /\[beg\]/i.test(post.articlecontent);
    if (!sellMoney && !isBeg && giftMoney <= 0) return undefined;
    const buyers = post.sellbuyer.split(",").filter(Boolean).map(Number);
    return {
      postId: post.id,
      viewerLogged: !!auth.user,
      viewerIsAuthor: auth.user?.userid === post.usrid,
      viewerIsStarter: auth.user?.userid === threadAuthorId,
      viewerIsAdmin: auth.isAdmin,
      viewerBought: auth.user ? buyers.includes(auth.user.userid) : false,
      isFirstPost: firstPost?.id === post.id,
      sellMoney,
      giftMoney,
      begSell: begMap.get(`${post.id}1`) ?? null,
      begGift: begMap.get(`${tid}2`) ?? null,
      begBeg: begMap.get(`${post.id}3`) ?? null,
      moneyUnit,
    };
  }

  return (
    <main>
      <NaviBar
        crumbs={[
          { name: "论坛首页", href: "/" },
          { name: cat?.bbsname ?? "版块" },
          { name: forum.bbsname, href: `/forums/${forum.id}` },
          { name: thread.title },
        ]}
        right={
          <>
            {total} 条回复 · {thread.hits} 次浏览
          </>
        }
      />

      {/* 主题标题栏 */}
      <div className="bmf-table-box">
        <div className="bmf-table-header">
          <span className="flex min-w-0 items-center gap-2">
            {thread.toptype === 1 && <span className="bmf-new !bg-[#e0871c]">置顶</span>}
            {thread.toptype === 2 && <span className="bmf-new !bg-[#8a6d3b]">精华</span>}
            {thread.islock === 1 && <span className="bmf-new !bg-[#999999]">锁定</span>}
            <span className="break-all text-[15px]">{thread.title}</span>
          </span>
          <span className="flex flex-wrap items-center gap-2 text-xs font-normal">
            <DiggButton
              tid={tid}
              initial={diggcount?.diggcount ?? 0}
              logged={!!auth.user}
              canDigg={!!auth.user && auth.user.candigg === 1}
            />
            <FavoriteButton tid={tid} initial={favorited} logged={!!auth.user} />
            {isMod && <TopicTools tid={tid} forumid={forum.id} />}
          </span>
        </div>

        {/* 投票 */}
        {poll && (
          <PollBox
            poll={poll}
            tid={tid}
            canVote={!!auth.user && !auth.isAdmin && auth.user.canvote === 1}
            voted={pollVoted}
            viewerPostamount={auth.user ? auth.user.postamount : 0}
            voters={pollVoters}
          />
        )}

        {/* 帖子列表 */}
        {posts.map((post, idx) => {
          const author = authors.get(post.usrid);
          const floor = offset + idx + 1;
          return (
            <div key={post.id} className="bmf-post-row">
              <div className="bmf-post-author">
                <div className="mb-1 font-bold text-[14px]" style={{ color: groupColor(author?.usergroup ?? 1) }}>
                  {post.username}
                </div>
                <div className="mb-1 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl(author?.avatar ?? "", post.usrid)}
                    alt={post.username}
                    width={70}
                    height={70}
                    className="border border-[#dddddd]"
                  />
                </div>
                <div className="mb-1">
                  <span style={{ color: groupColor(author?.usergroup ?? 1) }}>{groupName(author?.usergroup ?? 1)}</span>
                  {author?.headtitle ? <span className="ml-1 text-[#999]">· {author.headtitle}</span> : null}
                </div>
                <div className="space-y-0.5 text-left text-[11px] text-[#888]">
                  <div>头衔：{author?.desper || "新手上路"}</div>
                  <div>积分：{author?.point ?? 0}</div>
                  <div>帖子：{author?.postamount ?? 0}</div>
                  <div>金钱：{author?.money ?? 0}</div>
                  {author?.fromwhere ? <div>来自：{author.fromwhere}</div> : null}
                  <div>注册：{author?.regdate ? author.regdate.slice(0, 10) : "—"}</div>
                </div>
              </div>
              <div className="bmf-post-main">
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#f0f0f0] pb-1 text-xs text-[#999]">
                  <span className="min-w-0 flex-1 truncate">{post.articletitle || ""}</span>
                  <span className="flex-shrink-0">
                    <span className="mr-2 hidden md:inline">
                      <Link href={`/profile/${post.usrid}`}>查看资料</Link>
                    </span>
                    <span className="mr-2 hidden md:inline">
                      <Link href={`/messenger?to=${encodeURIComponent(post.username)}`}>发送短消息</Link>
                    </span>
                    <b className="text-[#3083be]">#{floor}</b>
                  </span>
                </div>
                <div
                  className="bmf-article"
                  dangerouslySetInnerHTML={{ __html: parseBmbCode(post.articlecontent, attachMap, buildTradeCtx(post), buildViewerCtx(post)) }}
                />
                {author?.signtext ? (
                  <div className="mt-4 border-t border-[#dddddd] pt-2 text-xs text-[#888]">
                    <span className="mr-1 text-[#bbb]">签名档：</span>
                    <span dangerouslySetInnerHTML={{ __html: parseBmbCode(author.signtext) }} />
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-[#999]">
                  <span className="max-w-full break-all">
                    发帖时间：{fmtTime(post.timestamp)}
                    {post.changtime > post.timestamp ? `（编辑于 ${fmtTime(post.changtime)}）` : ""}
                    {post.editinfo ? (() => {
                      const [ets, euser] = post.editinfo.split("|");
                      const etsn = Number(ets);
                      return Number.isFinite(etsn) && etsn > 0 && euser ? (
                        <span className="text-[#ddd]">
                          {" "}[此帖于 {fmtTime(etsn)} 由 {euser} 编辑]
                        </span>
                      ) : null;
                    })() : null}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {isMod && post.ip ? (
                      <span className="text-[#999]" title={`发帖IP：${post.ip}`}>
                        IP：{post.ip}
                      </span>
                    ) : null}
                    {auth.user && !thread.islock && firstPost && firstPost.usrid === auth.user.userid && post.usrid !== auth.user.userid && giftMoney > 0 && !post.articlecontent.includes("[gift=") ? (
                      <button type="button" className="text-[#3083be]" data-trade="gift" data-pid={post.id}>
                        发礼金
                      </button>
                    ) : null}
                    {auth.user && (auth.user.userid === post.usrid || isMod) ? (
                      <Link href={`/post?edit=${post.id}`} className="text-[#3083be]">
                        编辑
                      </Link>
                    ) : null}
                    {isMod && post.id !== firstPost?.id ? (
                      <span className="flex items-center gap-2">
                        <PostManageButton pid={post.id} tid={tid} action="trash" label="回收此帖" />
                        <PostManageButton pid={post.id} tid={tid} action="del" label="删除此帖" />
                      </span>
                    ) : null}
                    {auth.user && auth.user.userid !== post.usrid ? (
                      <ReportButton pid={post.id} logged={true} />
                    ) : null}
                    {auth.user && !thread.islock ? (
                      <Link
                        href={`/post?forumid=${forum.id}&replyto=${tid}&quote=${post.id}`}
                        className="bmf-btn !py-0.5 !text-xs"
                      >
                        引用回复
                      </Link>
                    ) : null}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 标签栏 */}
      {tags.length > 0 && (
        <div className="bmf-row mb-3 border border-[#dddddd] text-xs">
          <span className="mr-2 font-bold text-[#666]">Tags 标签：</span>
          {tags.map((t) => (
            <span key={t} className="bmf-tag mr-2">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <Pagination total={total} page={page} pages={pages} baseHref={`/topic/${tid}?p=`} />
        <Link href={`/forums/${forum.id}`} className="text-xs text-[#3083be]">
          « 返回 {forum.bbsname}
        </Link>
      </div>

      <TradeActions logged={!!auth.user} />

      <ReplyBox
        tid={tid}
        forumid={forum.id}
        logged={!!auth.user}
        locked={thread.islock === 1 && !isMod}
      />
    </main>
  );
}
