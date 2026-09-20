import { query } from "@/lib/db";

interface RssThread {
  tid: number;
  title: string;
  author: string;
  changetime: number;
  replys: number;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** GET /rss —— 最新主题 RSS 输出 */
export async function GET() {
  const threads = await query<RssThread>(
    `SELECT tid, title, author, changetime, replys FROM threads
     WHERE ttrash = 0 ORDER BY changetime DESC LIMIT 20`
  );
  const base = process.env.COZE_PROJECT_DOMAIN_DEFAULT || "";
  const items = threads
    .map(
      (t) => `    <item>
      <title>${esc(t.title)}</title>
      <link>${base}/topic/${t.tid}</link>
      <author>${esc(t.author)}</author>
      <pubDate>${new Date(t.changetime * 1000).toUTCString()}</pubDate>
      <guid>${base}/topic/${t.tid}</guid>
      <comments>${t.replys}</comments>
    </item>`
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BMForum 复刻版 - 最新主题</title>
    <link>${base}/</link>
    <description>经典论坛 BMForum 7 复刻版最新主题订阅</description>
    <language>zh-cn</language>
${items}
  </channel>
</rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
