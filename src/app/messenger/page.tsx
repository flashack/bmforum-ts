import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { query, queryOne, execute } from "@/lib/db";
import NaviBar from "@/components/bmf/navi-bar";
import ComposeForm from "@/components/bmf/compose-form";
import MessageActions from "@/components/bmf/message-actions";
import { fmtTime, fmtRelative } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "短消息" };

interface PmRow {
  id: number;
  belong: string;
  sender: string;
  sendto: string;
  prtitle: string;
  prcontent: string;
  prtime: number;
  prread: number;
  prtype: string;
}

export default async function MessengerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; to?: string; id?: string }>;
}) {
  const auth = await getAuth();
  if (!auth.user) redirect("/login");
  const sp = await searchParams;
  const tab = sp.tab ?? "inbox";

  const unread = await queryOne<{ c: string }>(
    "SELECT count(*) AS c FROM primsg WHERE belong = $1 AND prtype = 'r' AND prread = 0",
    [auth.user.username]
  );

  let rows: PmRow[] = [];
  if (tab === "inbox" || tab === "outbox") {
    rows = await query<PmRow>(
      `SELECT id, belong, sender, sendto, prtitle, prcontent, prtime, prread, prtype
       FROM primsg WHERE belong = $1 AND prtype = $2 ORDER BY prtime DESC LIMIT 50`,
      [auth.user.username, tab === "inbox" ? "r" : "s"]
    );
  }

  let reading: PmRow | null = null;
  if (tab === "read" && sp.id) {
    reading = await queryOne<PmRow>(
      `SELECT id, belong, sender, sendto, prtitle, prcontent, prtime, prread, prtype
       FROM primsg WHERE id = $1 AND belong = $2 AND prtype = 'r'`,
      [Number(sp.id), auth.user.username]
    );
    if (reading && reading.prread === 0) {
      await execute("UPDATE primsg SET prread = 1 WHERE id = $1", [reading.id]);
    }
  }

  const TABS: [string, string][] = [
    ["inbox", `收件箱${unread && Number(unread.c) > 0 ? `(${unread.c})` : ""}`],
    ["outbox", "发件箱"],
    ["compose", "撰写消息"],
  ];

  return (
    <main>
      <NaviBar crumbs={[{ name: "论坛首页", href: "/" }, { name: "短消息" }]} right={<>未读消息 {unread?.c ?? 0} 条</>} />

      <div className="bmf-table-box">
        <div className="bmf-col-head flex gap-4">
          {TABS.map(([key, label]) => (
            <Link key={key} href={`/messenger?tab=${key}`} className={tab === key ? "font-bold text-[#3083be]" : ""}>
              {label}
            </Link>
          ))}
        </div>

        {tab === "inbox" || tab === "outbox" ? (
          rows.length === 0 ? (
            <div className="bmf-row text-center text-xs text-[#999]">
              {tab === "inbox" ? "收件箱为空" : "发件箱为空"}
            </div>
          ) : (
            rows.map((m) => (
              <div key={m.id} className="bmf-row flex items-center text-[13px]">
                <span className="w-16 flex-shrink-0 text-center">
                  {tab === "inbox" ? (
                    m.prread === 0 ? (
                      <b className="text-[#cc3311]">新!</b>
                    ) : (
                      <span className="text-[#999]">已读</span>
                    )
                  ) : (
                    <span className="text-[#999]">已发</span>
                  )}
                </span>
                <span className="flex-1 truncate">
                  {tab === "inbox" ? (
                    <Link href={`/messenger?tab=read&id=${m.id}`}>{m.prtitle}</Link>
                  ) : (
                    m.prtitle
                  )}
                </span>
                <span className="w-28 flex-shrink-0 truncate text-xs text-[#666]">
                  {tab === "inbox" ? `来自：${m.sender}` : `发给：${m.sendto}`}
                </span>
                <span className="w-36 flex-shrink-0 text-right text-xs text-[#999]">{fmtTime(m.prtime)}</span>
                {tab === "inbox" && (
                  <span className="ml-3 w-10 flex-shrink-0 text-right">
                    <MessageActions id={m.id} />
                  </span>
                )}
              </div>
            ))
          )
        ) : tab === "compose" ? (
          <ComposeForm defaultTo={sp.to} />
        ) : reading ? (
          <div className="bmf-row">
            <div className="mb-2 border-b border-[#f0f0f0] pb-2 text-[13px]">
              <b>{reading.prtitle}</b>
              <span className="ml-3 text-xs text-[#999]">
                来自 {reading.sender} · {fmtRelative(reading.prtime)}（{fmtTime(reading.prtime)}）
              </span>
            </div>
            <div className="bmf-article text-[13px]" style={{ whiteSpace: "pre-wrap" }}>
              {reading.prcontent}
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <Link href={`/messenger?tab=compose&to=${encodeURIComponent(reading.sender)}`} className="bmf-btn !py-0.5">
                回复消息
              </Link>
              <Link href="/messenger?tab=inbox" className="bmf-btn !py-0.5">
                返回收件箱
              </Link>
            </div>
          </div>
        ) : (
          <div className="bmf-row text-center text-xs text-[#999]">消息不存在</div>
        )}
      </div>
    </main>
  );
}
