import { NextRequest } from "next/server";
import { queryOne, execute, transaction } from "@/lib/db";
import { str, num, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";

/** POST /api/threads/[tid]/manage —— 版主/管理员操作：置顶/加精/锁定/删除/移动 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tid: string }> }
) {
  const { tid: tidStr } = await params;
  const tid = Number(tidStr);
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");
  if (!auth.isMod) return fail("权限不足");

  const body = await readBody(req);
  const action = str(body, "action", 10);
  const thread = await queryOne<{ forumid: number; title: string }>(
    "SELECT forumid, title FROM threads WHERE tid = $1",
    [tid]
  );
  if (!thread) return fail("主题不存在");

  const now = Math.floor(Date.now() / 1000);
  switch (action) {
    case "sticky":
      await execute("UPDATE threads SET toptype = CASE WHEN toptype = 1 THEN 0 ELSE 1 END WHERE tid = $1", [tid]);
      return ok();
    case "digest":
      await execute("UPDATE threads SET toptype = CASE WHEN toptype = 2 THEN 0 ELSE 2 END WHERE tid = $1", [tid]);
      return ok();
    case "lock":
      await execute("UPDATE threads SET islock = CASE WHEN islock = 1 THEN 0 ELSE 1 END WHERE tid = $1", [tid]);
      return ok();
    case "move": {
      const to = num(body, "forumid");
      const target = await queryOne<{ id: number }>("SELECT id FROM forumdata WHERE id = $1 AND type = 'forum'", [to]);
      if (!Number.isInteger(to) || !target) return fail("目标版块不存在");
      await transaction(async (c) => {
        await c.query("UPDATE threads SET forumid = $2 WHERE tid = $1", [tid, to]);
        await c.query("UPDATE posts SET forumid = $2 WHERE tid = $1", [tid, to]);
        await c.query("UPDATE forumdata SET topicnum = topicnum - 1 WHERE id = $1", [thread.forumid]);
        await c.query("UPDATE forumdata SET topicnum = topicnum + 1 WHERE id = $1", [to]);
      });
      return ok();
    }
    case "delete":
      await transaction(async (c) => {
        const t = await c.query<{ replys: number }>("SELECT replys FROM threads WHERE tid = $1", [tid]);
        await c.query("DELETE FROM posts WHERE tid = $1", [tid]);
        await c.query("DELETE FROM threads WHERE tid = $1", [tid]);
        await c.query("DELETE FROM favorites WHERE tid = $1", [tid]);
        await c.query("DELETE FROM polls WHERE tid = $1", [tid]);
        await c.query("UPDATE forumdata SET topicnum = topicnum - 1 WHERE id = $1", [thread.forumid]);
        await c.query("UPDATE lastest SET postsnum = postsnum - $2", [t.rows[0] ? t.rows[0].replys + 1 : 1]);
      });
      return ok({ deleted: true });
    default:
      return fail("未知操作");
  }
}
