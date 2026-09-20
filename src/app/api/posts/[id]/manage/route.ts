import { NextRequest } from "next/server";
import { queryOne, transaction } from "@/lib/db";
import { str, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { logForumAction } from "@/lib/moderation";

/**
 * POST /api/posts/[id]/manage —— 单帖管理（原版 manage2.php）
 * trash=回收单帖 / del=删除单帖 / recover=从回收恢复
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const pid = Number(idStr);
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");
  if (!auth.isMod) return fail("权限不足");

  const body = await readBody(req);
  const action = str(body, "action", 10);

  const post = await queryOne<{ tid: number; forumid: number; posttrash: number }>(
    "SELECT tid, forumid, posttrash FROM posts WHERE id = $1",
    [pid]
  );
  if (!post) return fail("帖子不存在");

  const first = await queryOne<{ id: number }>(
    "SELECT id FROM posts WHERE tid = $1 ORDER BY id LIMIT 1",
    [post.tid]
  );
  if (first && first.id === pid) return fail("首帖请使用主题级操作");

  if (action === "trash" || action === "del") {
    await transaction(async (c) => {
      if (action === "del") {
        await c.query("DELETE FROM beg WHERE id = $1", [`${pid}1`]);
        await c.query("DELETE FROM beg WHERE id = $1", [`${pid}3`]);
        await c.query("DELETE FROM posts WHERE id = $1", [pid]);
      } else {
        await c.query("UPDATE posts SET posttrash = 1 WHERE id = $1", [pid]);
      }
      await c.query("UPDATE threads SET replys = GREATEST(replys - 1, 0) WHERE tid = $1", [post.tid]);
      await c.query("UPDATE forumdata SET replysnum = GREATEST(replysnum - 1, 0) WHERE id = $1", [post.forumid]);
      await c.query("UPDATE lastest SET postsnum = GREATEST(postsnum - 1, 0)");
    });
    await logForumAction(post.forumid, auth.user.username, action === "del" ? "删帖" : "回收单帖", `帖子 #${pid}`);
    return ok();
  }

  if (action === "recover") {
    await transaction(async (c) => {
      await c.query("UPDATE posts SET posttrash = 0 WHERE id = $1", [pid]);
      await c.query("UPDATE threads SET replys = replys + 1 WHERE tid = $1", [post.tid]);
      await c.query("UPDATE forumdata SET replysnum = replysnum + 1 WHERE id = $1", [post.forumid]);
      await c.query("UPDATE lastest SET postsnum = postsnum + 1");
    });
    await logForumAction(post.forumid, auth.user.username, "恢复单帖", `帖子 #${pid}`);
    return ok();
  }

  return fail("未知操作");
}
