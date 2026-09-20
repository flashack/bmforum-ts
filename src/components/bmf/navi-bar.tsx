import Link from "next/link";
import type { ReactNode } from "react";

export interface Crumb {
  name: string;
  href?: string;
}

/** 原版 navi_bar：面包屑 + 右侧统计 */
export default function NaviBar({ crumbs, right }: { crumbs: Crumb[]; right?: ReactNode }) {
  return (
    <div className="bmf-navi flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[#999]">»</span>}
            {c.href ? (
              <Link href={c.href} className="text-[#3083be]">
                {c.name}
              </Link>
            ) : (
              <span>{c.name}</span>
            )}
          </span>
        ))}
      </div>
      {right ? <div className="text-xs text-[#666]">{right}</div> : null}
    </div>
  );
}
