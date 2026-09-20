import Link from "next/link";
import { notFound } from "next/navigation";
import { queryOne, query } from "@/lib/db";
import NaviBar from "@/components/bmf/navi-bar";
import { avatarUrl, groupName, groupColor, fmtNumber } from "@/lib/format";
import { parseBmbCode } from "@/lib/bmbcode";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const id = Number(uid);
  if (!Number.isInteger(id)) notFound();

  const user = await queryOne<{
    userid: number;
    username: string;
    usergroup: number;
    headtitle: string;
    desper: string;
    postamount: number;
    point: number;
    money: number;
    regdate: string;
    signtext: string;
    homepage: string;
    fromwhere: string;
    lastlogin: number;
    avatar: string;
    birthday: string;
  }>(
    `SELECT userid, username, usergroup, headtitle, desper, postamount, point, money,
            regdate, signtext, homepage, fromwhere, lastlogin, avatar, birthday
     FROM userlist WHERE userid = $1`,
    [id]
  );
  if (!user) notFound();

  const recent = await query<{ tid: number; title: string; time: number }>(
    "SELECT tid, title, time FROM threads WHERE authorid = $1 AND ttrash = 0 ORDER BY time DESC LIMIT 8",
    [id]
  );

  return (
    <main>
      <NaviBar crumbs={[{ name: "论坛首页", href: "/" }, { name: "会员资料" }, { name: user.username }]} />
      <div className="bmf-table-box">
        <div className="bmf-table-header">
          <span>
            {user.username} 的资料
            <span className="ml-2 text-xs font-normal opacity-80" style={{ color: groupColor(user.usergroup) }}>
              <span style={{ color: "#cfe6f7" }}>{groupName(user.usergroup)}</span>
              {user.headtitle ? ` · ${user.headtitle}` : ""}
            </span>
          </span>
        </div>
        <div className="bmf-row flex gap-6">
          <div className="w-32 flex-shrink-0 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl(user.avatar, user.userid)}
              alt={user.username}
              width={96}
              height={96}
              className="mx-auto border border-[#dddddd]"
            />
          </div>
          <div className="grid max-md:grid-cols-1 flex-1 grid-cols-2 gap-x-8 gap-y-1 text-[13px]">
            <div>
              <span className="text-[#999]">头衔：</span>
              {user.desper || "新手上路"}
            </div>
            <div>
              <span className="text-[#999]">来自：</span>
              {user.fromwhere || "—"}
            </div>
            <div>
              <span className="text-[#999]">发帖：</span>
              {fmtNumber(user.postamount)} 篇
            </div>
            <div>
              <span className="text-[#999]">积分：</span>
              {fmtNumber(user.point)}
            </div>
            <div>
              <span className="text-[#999]">金钱：</span>
              {fmtNumber(user.money)}
            </div>
            <div>
              <span className="text-[#999]">注册日期：</span>
              {user.regdate ? user.regdate.slice(0, 10) : "—"}
            </div>
            <div>
              <span className="text-[#999]">生日：</span>
              {user.birthday || "—"}
            </div>
            <div>
              <span className="text-[#999]">主页：</span>
              {user.homepage ? (
                <a href={user.homepage} target="_blank" rel="noopener noreferrer" className="text-[#3083be]">
                  {user.homepage}
                </a>
              ) : (
                "—"
              )}
            </div>
            <div className="col-span-2">
              <span className="text-[#999]">签名档：</span>
              {user.signtext ? (
                <span dangerouslySetInnerHTML={{ __html: parseBmbCode(user.signtext) }} />
              ) : (
                "—"
              )}
            </div>
            <div className="col-span-2 mt-1 flex gap-3 text-xs">
              <Link href={`/messenger?to=${encodeURIComponent(user.username)}`} className="bmf-btn !py-0.5 !text-xs">
                发送短消息
              </Link>
              <Link href={`/search?author=${encodeURIComponent(user.username)}`} className="bmf-btn !py-0.5 !text-xs">
                搜索TA的帖子
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bmf-table-box">
        <div className="bmf-table-header">最近发表的主题</div>
        {recent.length === 0 ? (
          <div className="bmf-row text-center text-[#999] text-xs">暂无主题</div>
        ) : (
          recent.map((t) => (
            <div key={t.tid} className="bmf-row text-[13px]">
              <Link href={`/topic/${t.tid}`}>{t.title}</Link>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
