import Link from "next/link";
import { query } from "@/lib/db";
import NaviBar from "@/components/bmf/navi-bar";
import Pagination from "@/components/bmf/pagination";
import { avatarUrl, groupName, groupColor, fmtNumber, paginate } from "@/lib/format";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function UserListPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.p) || 1);
  const orderBy =
    sp.sort === "posts"
      ? "postamount DESC, userid ASC"
      : sp.sort === "new"
        ? "userid DESC"
        : "postamount DESC, userid ASC";

  const totalRow = await query<{ c: string }>("SELECT count(*) AS c FROM userlist");
  const total = parseInt(totalRow[0]?.c ?? "0", 10);
  const { pages, offset } = paginate(total, PER_PAGE, page);

  const users = await query<{
    userid: number;
    username: string;
    usergroup: number;
    postamount: number;
    point: number;
    money: number;
    regdate: string;
    fromwhere: string;
  }>(
    `SELECT userid, username, usergroup, postamount, point, money, regdate, fromwhere
     FROM userlist ORDER BY ${orderBy} LIMIT ${PER_PAGE} OFFSET ${offset}`
  );

  return (
    <main>
      <NaviBar
        crumbs={[{ name: "论坛首页", href: "/" }, { name: "会员列表" }]}
        right={
          <>
            排序：
            <Link href="/userlist?sort=posts" className={sp.sort !== "new" ? "font-bold" : ""}>
              按发帖
            </Link>
            {" / "}
            <Link href="/userlist?sort=new" className={sp.sort === "new" ? "font-bold" : ""}>
              按注册
            </Link>
          </>
        }
      />
      <div className="bmf-table-box">
        <div className="bmf-table-header">
          <span>会员列表（共 {fmtNumber(total)} 人）</span>
        </div>
        <div className="bmf-col-head flex">
          <span className="w-12 text-center">#</span>
          <span className="flex-1">会员名</span>
          <span className="w-28 text-center">用户组</span>
          <span className="w-20 text-center">发帖</span>
          <span className="w-20 text-center max-md:hidden">积分</span>
          <span className="w-28 text-center max-md:hidden">来自</span>
          <span className="w-28 text-center max-md:hidden">注册日期</span>
        </div>
        {users.map((u, i) => (
          <div key={u.userid} className="bmf-row flex items-center text-[13px]">
            <span className="w-12 text-center text-xs text-[#999]">{offset + i + 1}</span>
            <span className="flex flex-1 items-center gap-2 truncate">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl("", u.userid)} alt="" width={20} height={20} className="rounded-[2px]" />
              <Link href={`/profile/${u.userid}`} style={{ color: groupColor(u.usergroup) }}>
                {u.username}
              </Link>
            </span>
            <span className="w-28 text-center text-xs">{groupName(u.usergroup)}</span>
            <span className="w-20 text-center text-xs">{fmtNumber(u.postamount)}</span>
            <span className="w-20 text-center text-xs max-md:hidden">{fmtNumber(u.point)}</span>
            <span className="w-28 truncate text-center text-xs text-[#999] max-md:hidden">{u.fromwhere || "—"}</span>
            <span className="w-28 text-center text-xs text-[#999] max-md:hidden">{u.regdate ? u.regdate.slice(0, 10) : "—"}</span>
          </div>
        ))}
      </div>
      <Pagination total={total} page={page} pages={pages} baseHref={`/userlist?sort=${sp.sort ?? "posts"}&p=`} />
    </main>
  );
}
