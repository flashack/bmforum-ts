import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import NaviBar from "@/components/bmf/navi-bar";
import {
  ForumAdmin,
  AnnounceAdmin,
  UsersAdmin,
  GroupsAdmin,
  RecycleAdmin,
  WordsAdmin,
  IpbanAdmin,
  InviteAdmin,
  RebuildButton,
} from "@/components/bmf/admin-panels";
import { fmtTime } from "@/lib/format";

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
}

const TABS: [string, string][] = [
  ["forums", "版块管理"],
  ["announce", "公告管理"],
  ["users", "用户管理"],
  ["groups", "用户组权限"],
  ["recycle", "回收站"],
  ["words", "敏感词过滤"],
  ["ipban", "IP 封禁"],
  ["invite", "邀请注册"],
  ["logs", "管理日志"],
  ["rebuild", "缓存重建"],
];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const auth = await getAuth();
  if (!auth.user) redirect("/login");
  if (auth.user.usergroup !== 3) redirect("/");

  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp.tab) ? (sp.tab as string) : "forums";

  const forums =
    tab === "forums"
      ? await query<ForumRow>("SELECT id, type, bbsname, cdes, blad, forum_cid, topicnum, replysnum FROM forumdata ORDER BY type, showorder, id")
      : [];
  const anns = tab === "announce" ? await query<{ id: number; title: string; author: string; addtime: number }>("SELECT id, title, author, addtime FROM announces ORDER BY addtime DESC LIMIT 20") : [];
  const users =
    tab === "users"
      ? await query<{ userid: number; username: string; usergroup: number; postamount: number; regdate: string }>(
          "SELECT userid, username, usergroup, postamount, regdate FROM userlist ORDER BY userid DESC LIMIT 50"
        )
      : [];
  const groups =
    tab === "groups"
      ? await query<{
          id: number;
          groupname: string;
          canview: number;
          canpost: number;
          canreply: number;
          canupload: number;
          canvote: number;
          canpm: number;
          candigg: number;
          cansearch: number;
        }>("SELECT id, groupname, canview, canpost, canreply, canupload, canvote, canpm, candigg, cansearch FROM usergroup ORDER BY id")
      : [];
  const recycle =
    tab === "recycle"
      ? await query<{ tid: number; title: string; author: string; forumname: string | null; changetime: number }>(
          `SELECT t.tid, t.title, t.author, f.bbsname AS forumname, t.changetime
           FROM threads t LEFT JOIN forumdata f ON f.id = t.forumid
           WHERE t.ttrash = 1 ORDER BY t.changetime DESC`
        )
      : [];
  const words = tab === "words" ? await query<{ id: number; find: string; replacewith: string }>("SELECT id, find, replacewith FROM wordfilter ORDER BY id") : [];
  const ipbans = tab === "ipban" ? await query<{ id: number; ip: string; reason: string; addtime: number }>("SELECT id, ip, reason, addtime FROM ipban ORDER BY id DESC") : [];
  const invites =
    tab === "invite"
      ? await query<{ id: number; code: string; usedby: string; usedtime: number; createtime: number }>(
          "SELECT id, code, usedby, usedtime, createtime FROM invitecode ORDER BY id DESC LIMIT 100"
        )
      : [];
  const invitereg = tab === "invite" ? await queryOne<{ value: string }>("SELECT value FROM config WHERE key = 'invitereg'") : null;
  const logs =
    tab === "logs"
      ? await query<{ id: number; time: number; operator: string; action: string; detail: string }>(
          "SELECT id, time, operator, action, detail FROM adminlog ORDER BY id DESC LIMIT 100"
        )
      : [];

  return (
    <main>
      <NaviBar crumbs={[{ name: "论坛首页", href: "/" }, { name: "后台管理" }]} />

      <div className="bmf-table-box">
        <div className="bmf-table-header">论坛后台管理</div>
        <div className="flex flex-wrap border-b border-[#dddddd] bg-[#f5f5f5] px-2 pt-2 text-[13px]">
          {TABS.map(([key, label]) => (
            <Link
              key={key}
              href={`/admin?tab=${key}`}
              className={
                tab === key
                  ? "border border-b-0 border-[#dddddd] bg-white px-3 py-1.5 font-bold text-[#3083be]"
                  : "px-3 py-1.5 text-[#666666] hover:text-[#3083be] hover:underline"
              }
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="p-4">
          {tab === "forums" && <ForumAdmin rows={forums} />}
          {tab === "announce" && <AnnounceAdmin rows={anns} />}
          {tab === "users" && <UsersAdmin rows={users} />}
          {tab === "groups" && <GroupsAdmin rows={groups} />}
          {tab === "recycle" && <RecycleAdmin rows={recycle} />}
          {tab === "words" && <WordsAdmin rows={words} />}
          {tab === "ipban" && <IpbanAdmin rows={ipbans} />}
          {tab === "invite" && <InviteAdmin rows={invites} enabled={invitereg?.value === "1"} />}
          {tab === "rebuild" && <RebuildButton />}
          {tab === "logs" && (
            <div>
              {logs.length === 0 ? (
                <div className="text-xs text-[#999999]">暂无管理日志。</div>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="border-b border-[#f0f0f0] py-1.5 text-[12px]">
                    <span className="mr-2 text-[#999999]">{fmtTime(l.time)}</span>
                    <b className="text-[#336699]">{l.operator}</b>
                    <span className="mx-2 rounded-sm bg-[#eef4fa] px-1.5 text-[11px] text-[#336699]">{l.action}</span>
                    <span className="text-[#555555]">{l.detail}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
