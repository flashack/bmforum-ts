import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

const PALETTE = [
  ["#3083be", "#ffffff"],
  ["#0a7d32", "#ffffff"],
  ["#c43c35", "#ffffff"],
  ["#8a6d3b", "#ffffff"],
  ["#4b6ea9", "#ffffff"],
  ["#7a4b9f", "#ffffff"],
  ["#b3730f", "#ffffff"],
  ["#2f7f7f", "#ffffff"],
];

/** GET /api/avatar/[id] —— 按用户名首字生成经典色块头像 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = Number(id);
  const user = await queryOne<{ username: string }>("SELECT username FROM userlist WHERE userid = $1", [
    Number.isFinite(uid) ? uid : 0,
  ]);
  const name = user?.username || "?";
  const ch = name.slice(0, 1).toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const [bg, fg] = PALETTE[hash % PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
<rect width="80" height="80" rx="3" fill="${bg}"/>
<text x="40" y="52" font-family="system-ui,sans-serif" font-size="34" font-weight="bold" fill="${fg}" text-anchor="middle">${ch}</text>
</svg>`;
  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
  });
}
