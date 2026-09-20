import { NextRequest } from "next/server";
import { queryOne, execute, transaction } from "@/lib/db";
import { str, num, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";

/** POST /api/admin/forums —— 后台：新增/编辑/删除版块与分类 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");
  if (!auth.isAdmin) return fail("权限不足");

  const body = await readBody(req);
  const action = str(body, "action", 10);

  if (action === "create") {
    const type = str(body, "type", 10) === "category" ? "category" : "forum";
    const bbsname = str(body, "bbsname", 100) || str(body, "name", 100);
    const cdes = str(body, "cdes", 300) || str(body, "description", 300);
    const blad = str(body, "blad", 200) || str(body, "moderators", 200);
    const forumCid = num(body, "forum_cid") || num(body, "categoryId") || 0;
    const showorder = num(body, "showorder") || 0;
    if (!bbsname) return fail("名称不能为空");
    if (type === "forum" && !forumCid) return fail("请选择所属分类");
    const r = await execute(
      `INSERT INTO forumdata (type, bbsname, cdes, blad, forum_cid, showorder, topicnum, replysnum, todayp)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0)`,
      [type, bbsname, cdes, blad, type === "forum" ? forumCid : 0, showorder]
    );
    if (!r) return fail("创建失败", 500);
    return ok();
  }

  if (action === "edit") {
    const id = num(body, "id");
    const bbsname = str(body, "bbsname", 100);
    const cdes = str(body, "cdes", 300);
    const blad = str(body, "blad", 200);
    if (!Number.isInteger(id) || !bbsname) return fail("参数错误");
    await execute("UPDATE forumdata SET bbsname = $2, cdes = $3, blad = $4 WHERE id = $1", [id, bbsname, cdes, blad]);
    return ok();
  }

  if (action === "delete") {
    const id = num(body, "id");
    const fd = await queryOne<{ type: string }>("SELECT type FROM forumdata WHERE id = $1", [id]);
    if (!fd) return fail("版块不存在");
    if (fd.type === "forum") {
      const cnt = await queryOne<{ c: string }>(
        "SELECT count(*) AS c FROM threads WHERE forumid = $1",
        [id]
      );
      if (cnt && Number(cnt.c) > 0) return fail("该版块下仍有主题，无法删除");
      await execute("DELETE FROM forumdata WHERE id = $1", [id]);
    } else {
      const sub = await queryOne<{ c: string }>(
        "SELECT count(*) AS c FROM forumdata WHERE forum_cid = $1 AND type = 'forum'",
        [id]
      );
      if (sub && Number(sub.c) > 0) return fail("该分类下仍有版块，无法删除");
      await execute("DELETE FROM forumdata WHERE id = $1", [id]);
    }
    return ok();
  }

  return fail("未知操作");
}
