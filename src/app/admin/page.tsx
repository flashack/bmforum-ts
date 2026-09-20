import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import NaviBar from "@/components/bmf/navi-bar";
import AdminForms from "@/components/bmf/admin-forms";
import { fmtTime, groupName } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "论坛后台管理" };

interface ForumRow {
  id: number;
  type: string;
  bbsname: string;
  cdes: string;
  blad: string;
  forum_cid: number;
  topicnum: number;
  replysnum: number;
  todayp: number;
}

interface AnnRow {
  id: number;
  title: string;
  content: string;
  author: string;
  addtime: number;
}

export default async function AdminPage() {
  const auth = await getAuth();
  if (!auth.user) redirect("/login");
  if (auth.user.usergroup !== 3) redirect("/");

  const forums = await query<ForumRow>(
    "SELECT id, type, bbsname, cdes, blad, forum_cid, topicnum, replysnum, todayp FROM forumdata ORDER BY type, showorder, id"
  );
  const anns = await query<AnnRow>("SELECT id, title, content, author, addtime FROM announces ORDER BY addtime DESC LIMIT 10");
  const users = await query<{ userid: number; username: string; usergroup: number; postamount: number; regdate: string }>(
    "SELECT userid, username, usergroup, postamount, regdate FROM userlist ORDER BY userid DESC LIMIT 20"
  );

  return (
    <main>
      <NaviBar crumbs={[{ name: "论坛首页", href: "/" }, { name: "后台管理" }]} />

      <div className="bmf-table-box">
        <div className="bmf-table-header">论坛管理</div>
        <AdminForms />
      </div>

      <div className="bmf-table-box">
        <div className="bmf-table-header">版块结构一览</div>
        {forums.map((f) =>
          f.type === "category" ? (
            <div key={f.id} className="bmf-subhead text-[13px]">
              #{f.id} 分类：{f.bbsname}
            </div>
          ) : (
            <div key={f.id} className="bmf-row flex items-center text-[13px]">
              <span className="w-10 flex-shrink-0 text-xs text-[#999]">#{f.id}</span>
              <span className="flex-1 truncate">
                <Link href={`/forums/${f.id}`} className="font-bold">
                  {f.bbsname}
                </Link>
                <span className="ml-2 text-xs text-[#999]">{f.cdes}</span>
              </span>
              <span className="w-24 flex-shrink-0 text-xs text-[#666]">版主：{f.blad || "暂无"}</span>
              <span className="w-20 flex-shrink-0 text-center text-xs text-[#999]">{f.topicnum} 主题</span>
              <span className="w-20 flex-shrink-0 text-center text-xs text-[#999]">{f.replysnum} 回复</span>
            </div>
          )
        )}
      </div>

      <div className="bmf-table-box">
        <div className="bmf-table-header">最新公告</div>
        {anns.map((a) => (
          <div key={a.id} className="bmf-row text-[13px]">
            <b>{a.title}</b>
            <span className="ml-2 text-xs text-[#999]">
              {a.author} · {fmtTime(a.addtime)}
            </span>
            <div className="mt-1 line-clamp-2 text-xs text-[#555]">{a.content}</div>
          </div>
        ))}
        {anns.length === 0 && <div className="bmf-row text-center text-xs text-[#999]">暂无公告</div>}
      </div>

      <div className="bmf-table-box">
        <div className="bmf-table-header">最新注册会员</div>
        {users.map((u) => (
          <div key={u.userid} className="bmf-row flex items-center text-[13px]">
            <span className="w-12 flex-shrink-0 text-xs text-[#999]">#{u.userid}</span>
            <span className="flex-1">
              <Link href={`/profile/${u.userid}`}>{u.username}</Link>
              <span className="ml-2 text-xs text-[#999]">{groupName(u.usergroup)}</span>
            </span>
            <span className="w-24 flex-shrink-0 text-center text-xs text-[#999]">{u.postamount} 帖</span>
            <span className="w-40 flex-shrink-0 text-right text-xs text-[#999]">注册于 {u.regdate || "-"}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
