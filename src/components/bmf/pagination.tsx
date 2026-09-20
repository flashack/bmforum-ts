import Link from "next/link";

interface Props {
  total: number;
  page: number;
  pages: number;
  baseHref: string; // 形如 /forums/20?p=
}

export default function Pagination({ total, page, pages, baseHref }: Props) {
  if (pages <= 1) return <div className="text-xs text-[#999]">共 {total} 条</div>;
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 2) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <div className="flex items-center gap-2 text-xs text-[#666]">
      <span>
        共 {total} 条 / {pages} 页
      </span>
      <span className="flex gap-1">
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="px-1 text-[#999]">
              …
            </span>
          ) : n === page ? (
            <span key={n} className="border border-[#3083be] bg-[#3083be] px-2 py-0.5 font-bold text-white">
              {n}
            </span>
          ) : (
            <Link
              key={n}
              href={`${baseHref}${n}`}
              className="border border-[#dddddd] bg-white px-2 py-0.5 text-[#3083be] hover:no-underline"
            >
              {n}
            </Link>
          )
        )}
      </span>
    </div>
  );
}
