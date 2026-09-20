import { NextRequest } from "next/server";
import { queryOne, transaction } from "@/lib/db";
import { str, num, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";

/** POST /api/transfer —— 金钱转账 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");

  const body = await readBody(req);
  const to = str(body, "to", 30);
  const amount = num(body, "amount");
  if (!to || !Number.isInteger(amount) || amount <= 0) return fail("请填写收款人和转账金额");
  if (amount > 1000000) return fail("单笔转账不能超过 1000000");
  if (to === auth.user.username) return fail("不能转账给自己");

  const target = await queryOne<{ username: string }>(
    "SELECT username FROM userlist WHERE lower(username) = lower($1)",
    [to]
  );
  if (!target) return fail("收款用户不存在");

  const r = await transaction(async (c) => {
    const sender = await c.query<{ money: number }>(
      "SELECT money FROM userlist WHERE userid = $1 FOR UPDATE",
      [auth.user!.userid]
    );
    if (!sender.rows[0] || sender.rows[0].money < amount) {
      throw new Error("余额不足");
    }
    await c.query("UPDATE userlist SET money = money - $2 WHERE userid = $1", [
      auth.user!.userid,
      amount,
    ]);
    await c.query("UPDATE userlist SET money = money + $2 WHERE username = $1", [
      target.username,
      amount,
    ]);
    return true;
  }).catch((e: Error) => e.message);

  if (r !== true) return fail(typeof r === "string" ? r : "转账失败");
  return ok();
}
