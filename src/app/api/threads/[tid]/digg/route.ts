import { NextRequest } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";
import { sendNotification } from "@/lib/moderation";

/** POST /api/threads/[tid]/digg —— 点赞主题（每用户一次） */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tid: string }> }
) {
  const { tid: tidStr } = await params;
  const tid = Number(tidStr);
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录后再点赞");
  if (!auth.user.candigg) return fail("您所在的用户组无权点赞", 403);
  if (!Number.isInteger(tid)) return fail("主题参数错误");

  const thread = await queryOne<{ authorid: number; title: string; digguser: string }>(
    "SELECT authorid, title, digguser FROM threads WHERE tid = $1",
    [tid]
  );
  if (!thread) return fail("主题不存在");

  const list = thread.digguser ? thread.digguser.split(",").filter(Boolean) : [];
  if (list.includes(auth.user.username)) return fail("您已赞过本主题");

  list.push(auth.user.username);
  await execute("UPDATE threads SET diggcount = diggcount + 1, digguser = $2 WHERE tid = $1", [
    tid,
    list.join(","),
  ]);

  await sendNotification(
    auth.user.userid,
    auth.user.username,
    thread.authorid,
    "digg",
    `赞了您的主题「${thread.title}」`,
    tid
  );
  return ok({ diggcount: list.length });
}
