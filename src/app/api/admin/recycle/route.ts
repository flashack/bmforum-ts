import { NextRequest } from "next/server";
import { queryOne, execute, transaction } from "@/lib/db";
import { num, str, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { logAdminAction } from "@/lib/moderation";

/** POST /api/admin/recycle —— 回收站管理 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user || !auth.isAdmin) return fail("权限不足", 403);

  const body = await readBody(req);
  const action = str(body, "action", 10);
  const tid = num(body, "tid");

  if (action === "restore") {
    if (!Number.isInteger(tid)) return fail("参数错误");
    const t = await queryOne<{ forumid: number }>("SELECT forumid FROM threads WHERE tid = $1 AND ttrash = 1", [tid]);
    if (!t) return fail("主题不在回收站中");
    await transaction(async (c) => {
      await c.query("UPDATE threads SET ttrash = 0 WHERE tid = $1", [tid]);
      await c.query("UPDATE forumdata SET topicnum = topicnum + 1 WHERE id = $1", [t.forumid]);
      await c.query("UPDATE lastest SET threadnum = threadnum + 1");
    });
    await logAdminAction(auth.user.username, "restore", `还原主题 tid=${tid}`);
    return ok();
  }

  if (action === "purge") {
    if (!Number.isInteger(tid)) return fail("参数错误");
    await transaction(async (c) => {
      await c.query("DELETE FROM posts WHERE tid = $1", [tid]);
      await c.query("DELETE FROM thread_tags WHERE tid = $1", [tid]);
      await c.query("DELETE FROM polls WHERE tid = $1", [tid]);
      await c.query("DELETE FROM favorites WHERE tid = $1", [tid]);
      await c.query("DELETE FROM threads WHERE tid = $1 AND ttrash = 1", [tid]);
    });
    await logAdminAction(auth.user.username, "purge", `彻底删除主题 tid=${tid}`);
    return ok();
  }

  if (action === "purgeall") {
    await transaction(async (c) => {
      const ids = await c.query<{ tid: number }>("SELECT tid FROM threads WHERE ttrash = 1");
      const tids = ids.rows.map((r) => r.tid);
      if (tids.length > 0) {
        await c.query("DELETE FROM posts WHERE tid = ANY($1)", [tids]);
        await c.query("DELETE FROM thread_tags WHERE tid = ANY($1)", [tids]);
        await c.query("DELETE FROM polls WHERE tid = ANY($1)", [tids]);
        await c.query("DELETE FROM favorites WHERE tid = ANY($1)", [tids]);
        await c.query("DELETE FROM threads WHERE ttrash = 1");
      }
    });
    await logAdminAction(auth.user.username, "purgeall", "清空回收站");
    return ok();
  }

  return fail("未知操作");
}
