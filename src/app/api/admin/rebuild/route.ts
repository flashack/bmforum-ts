import { NextRequest } from "next/server";
import { query, execute, transaction } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { logAdminAction } from "@/lib/moderation";

/** POST /api/admin/rebuild —— 重建统计缓存 */
export async function POST(_req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);

  await transaction(async (c) => {
    // 版块主题/回复数
    await c.query(`UPDATE forumdata f SET
      topicnum = COALESCE((SELECT count(*) FROM threads t WHERE t.forumid = f.id AND t.ttrash = 0), 0),
      replysnum = COALESCE((SELECT count(*) FROM posts p WHERE p.forumid = f.id) - COALESCE((SELECT count(*) FROM threads t WHERE t.forumid = f.id AND t.ttrash = 0), 0), 0)`);
    // 最新一条发表
    await c.query(`UPDATE forumdata f SET
      fltitle = tt.title, flposter = tt.author, flposttime = tt.changetime
      FROM (SELECT DISTINCT ON (forumid) forumid, title, author, changetime
            FROM threads WHERE ttrash = 0 ORDER BY forumid, changetime DESC) tt
      WHERE f.id = tt.forumid`);
    // 全站统计
    await c.query(`UPDATE lastest SET
      threadnum = (SELECT count(*) FROM threads WHERE ttrash = 0),
      postsnum = (SELECT count(*) FROM posts) + (SELECT count(*) FROM threads WHERE ttrash = 0),
      regednum = (SELECT count(*) FROM userlist)`);
    // 标签主题数
    await c.query(`UPDATE tags g SET threads = COALESCE((SELECT count(*) FROM thread_tags tt WHERE tt.tagid = g.tagid), 0)`);
    await c.query("DELETE FROM tags WHERE threads = 0");
    // 最后发表信息
    const last = await c.query<{ author: string; tid: number; changetime: number; title: string }>(
      "SELECT author, tid, changetime, title FROM threads WHERE ttrash = 0 ORDER BY changetime DESC LIMIT 1"
    );
    if (last.rows[0]) {
      await c.query("UPDATE lastest SET lastposter = $1, lastpostid = $2, lastptime = $3", [
        last.rows[0].author,
        last.rows[0].tid,
        last.rows[0].changetime,
      ]);
    }
  });

  await logAdminAction(auth.user.username, "rebuild", "重建统计缓存");
  return ok();
}
