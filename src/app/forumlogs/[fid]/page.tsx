import Link from "next/link";
import { notFound } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import NaviBar from "@/components/bmf/navi-bar";
import { fmtFullDate, fmtShortTime } from "@/lib/format";
import LogCleanButton from "@/components/bmf/log-clean-button";

/** 原版 forumlogs.php 动作码 → 中文 */
const ACTION_NAMES: Record<string, string> = {
  move: "移动主题",
  copy: "复制主题",
  del: "删除主题",
  delreply: "删除回复",
  jihua: "加入精华",
  unjihua: "解除精华",
  lock: "锁定主题",
  unlock: "解锁主题",
  holdfront: "置顶主题",
  unhold: "解除置顶",
  btfront: "提前主题",
  recycle: "回收主题",
  recover: "恢复主题",
  trash: "回收单帖",
  recoverpost: "恢复单帖",
  delpost: "删除单帖",
  edit: "编辑帖子",
};

const PER_PAGE = 20;

export default async function ForumLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ fid: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { fid } = await params;
  const sp = await searchParams;
  const id = Number(fid);
  if (!Number.isInteger(id)) notFound();

  const auth = await getAuth();
  const forum = await queryOne<{ bbsname: string; blad: string }>(
    `SELECT bbsname, blad FROM forumdata WHERE id = $1 AND type = 'forum'`,
    [id]
  );
  if (!forum) notFound();

  // 权限：管理员 / 版主组 / 本版版主（原版 check_admin_permission）
  const bladMods = forum.blad ? forum.blad.split(",").filter(Boolean) : [];
  const isThisMod =
    auth.user &&
    (auth.user.usergroup === 3 || auth.user.usergroup === 2 || bladMods.includes(auth.user.username));
  if (!isThisMod) {
    return (
      <main>
        <NaviBar
          crumbs={[{ name: "论坛首页", href: "/" }, { name: forum.bbsname, href: `/forums/${id}` }, { name: "版块日志" }]}
        />
        <div className="bmf-table-box">
          <div className="bmf-row text-center text-[13px] text-[#666]">
            您不是本版版主，无权查看版块日志。
          </div>
        </div>
      </main>
    );
  }

  const page = Math.max(1, Number(sp.p) || 1);
  const totalRow = await queryOne<{ n: number }>(
    "SELECT count(*)::int AS n FROM forumlog WHERE fid = $1",
    [id]
  );
  const total = totalRow?.n ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const logs = await query<{ id: number; time: number; operator: string; action: string; detail: string }>(
    "SELECT id, time, operator, action, detail FROM forumlog WHERE fid = $1 ORDER BY time DESC LIMIT $2 OFFSET $3",
    [id, PER_PAGE, (page - 1) * PER_PAGE]
  );

  return (
    <main>
      <NaviBar
        crumbs={[
          { name: "论坛首页", href: "/" },
          { name: forum.bbsname, href: `/forums/${id}` },
          { name: "版块日志" },
        ]}
      />
      <div className="bmf-table-box">
        <div className="bmf-table-header">
          <span>
            {forum.bbsname} · 版块日志（共 {total} 条）
          </span>
          {auth.user?.usergroup === 3 ? (
            <LogCleanButton fid={id} />
          ) : (
            <Link href={`/forums/${id}`} className="text-xs font-normal">
              返回版块 »
            </Link>
          )}
        </div>
        {logs.length === 0 ? (
          <div className="bmf-row text-center text-xs text-[#999]">本版块暂无管理日志。</div>
        ) : (
          <div className="bmf-row p-0">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#ddd] bg-[#f5f5f5] text-left text-xs text-[#666]">
                  <th className="px-3 py-1.5 font-normal">时间</th>
                  <th className="px-3 py-1.5 font-normal">操作人</th>
                  <th className="px-3 py-1.5 font-normal">动作</th>
                  <th className="px-3 py-1.5 font-normal">详情</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-[#f0f0f0]">
                    <td className="whitespace-nowrap px-3 py-1.5 text-xs text-[#666]">
                      <span className="md:hidden">{fmtShortTime(l.time)}</span>
                      <span className="hidden md:inline">{fmtFullDate(l.time)}</span>
                    </td>
                    <td className="px-3 py-1.5 text-[#3083be]">{l.operator}</td>
                    <td className="px-3 py-1.5">{ACTION_NAMES[l.action] ?? l.action}</td>
                    <td className="break-all px-3 py-1.5 text-xs text-[#666]">{l.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex flex-wrap justify-center gap-1 py-2 text-xs">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={`/forumlogs/${id}?p=${n}`}
                className={n === page ? "rounded-sm bg-[#3083be] px-2 py-0.5 font-bold text-white" : "rounded-sm border border-[#ccc] bg-white px-2 py-0.5"}
              >
                {n}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
