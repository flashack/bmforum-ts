import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { execute, query, queryOne } from "@/lib/db";
import { ok, fail } from "@/lib/api";

const TYPE_NAMES: Record<number, string> = { 0: "好友", 1: "特别关注", 2: "黑名单" };

/** 解析 type：0=好友 1=特别关注 2=黑名单 */
function parseType(v: unknown): number {
  const n = Number(v) || 0;
  return Math.min(2, Math.max(0, n));
}

/** GET /api/contacts —— 当前用户名单（联表带出发帖数） */
export async function GET() {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录", 401);
  const rows = await query<{
    id: number;
    userid: number;
    username: string;
    postamount: number;
    type: number;
    adddate: number;
  }>(
    `SELECT c.id, u.userid, u.username, u.postamount, c.type, c.adddate
     FROM contacts c JOIN userlist u ON u.userid = c.contacts
     WHERE c.owner = $1 ORDER BY c.type, c.id`,
    [auth.user.userid]
  );
  return NextResponse.json({ ok: true, list: rows });
}

/** POST /api/contacts —— 添加联系人（兼容 {username} 与 {action:"add", name, type}） */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录", 401);

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    username?: string;
    name?: string;
    type?: number;
  };
  const action = typeof body.action === "string" && body.action ? body.action : "add";
  const uid = auth.user.userid;

  if (action === "clean") {
    await execute("DELETE FROM contacts WHERE owner = $1", [uid]);
    return ok({ ok: true, message: "名单已清空" });
  }

  if (action === "del") {
    const name = (body.username ?? body.name ?? "").trim();
    if (!name) return fail("参数错误");
    const r = await execute(
      `DELETE FROM contacts WHERE owner = $1 AND contacts IN (SELECT userid FROM userlist WHERE username = $2)`,
      [uid, name]
    );
    if (!r.rowCount) return fail("该联系人不存在");
    return ok({ ok: true, message: "已删除" });
  }

  // add
  const name = (body.username ?? body.name ?? "").trim().slice(0, 24);
  const type = parseType(body.type);
  if (!name) return fail("请填写用户名");
  const target = await queryOne<{ userid: number }>(
    "SELECT userid FROM userlist WHERE username = $1",
    [name]
  );
  if (!target) return fail("该用户不存在");
  if (target.userid === uid) return fail("不能添加自己");
  const dup = await queryOne<{ n: number }>(
    "SELECT count(*)::int AS n FROM contacts WHERE owner = $1 AND contacts = $2 AND type = $3",
    [uid, target.userid, type]
  );
  if (dup && dup.n > 0) return fail(`该用户已在${TYPE_NAMES[type]}名单中`);
  await execute(
    "INSERT INTO contacts (owner, contacts, type, conname, adddate) VALUES ($1, $2, $3, $4, $5)",
    [uid, target.userid, type, name, Math.floor(Date.now() / 1000)]
  );
  return ok({ ok: true, message: `已加入${TYPE_NAMES[type]}` });
}

/** DELETE /api/contacts —— 删除联系人 body: {username} */
export async function DELETE(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录", 401);
  const body = (await req.json().catch(() => ({}))) as { username?: string };
  const name = (body.username ?? "").trim();
  if (!name) return fail("参数错误");
  const r = await execute(
    `DELETE FROM contacts WHERE owner = $1 AND contacts IN (SELECT userid FROM userlist WHERE username = $2)`,
    [auth.user.userid, name]
  );
  if (!r.rowCount) return fail("该联系人不存在");
  return ok({ ok: true, message: "已删除" });
}
