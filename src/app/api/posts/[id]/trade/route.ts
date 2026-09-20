import { NextRequest } from "next/server";
import { queryOne, transaction } from "@/lib/db";
import { readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";

/**
 * POST /api/posts/[id]/trade —— 出售/礼金/求赏交易（复刻原版 sell.php）
 * action:
 *  - buy    购买出售内容：扣买家 M → 加作者 M；posts.sellbuyer += uid；beg(id=pid+"1") 记账
 *  - refund 作者退款：按 beg.giftid("uid|金额") 逐个退还买家 → 扣作者总额；删 beg 行；sellbuyer 清空
 *  - gift   楼主对某回复发放礼金：扣楼主 M → 加回复作者 M；beg(id=tid+"2") 记账
 *  - beg    向帖子作者捐助：扣捐助者 X → 加作者 X；beg(id=pid+"3") 记账
 */

function parseIntTag(content: string, tag: "sell" | "gift"): number {
  const m = content.match(new RegExp(`\\[${tag}=(\\d{1,9})\\]`, "i"));
  return m ? parseInt(m[1], 10) : 0;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录后再进行交易");
  const viewer = auth.user;

  const { id: idStr } = await ctx.params;
  const pid = Number(idStr);
  if (!Number.isInteger(pid) || pid <= 0) return fail("帖子参数错误");

  const body = await readBody(req);
  const action = typeof body.action === "string" ? body.action : "";

  const post = await queryOne<{
    id: number;
    tid: number;
    username: string;
    usrid: number;
    articlecontent: string;
    sellbuyer: string;
    posttrash: number;
  }>("SELECT id, tid, username, usrid, articlecontent, sellbuyer, posttrash FROM posts WHERE id = $1", [pid]);
  if (!post || post.posttrash === 1) return fail("目标帖子不存在");

  const thread = await queryOne<{ tid: number; title: string; authorid: number; ttrash: number; islock: number }>(
    "SELECT tid, title, authorid, ttrash, islock FROM threads WHERE tid = $1",
    [post.tid]
  );
  if (!thread || thread.ttrash === 1) return fail("所属主题不存在");
  const isStarter = thread.authorid === viewer.userid;
  const isAuthor = post.usrid === viewer.userid;

  // 提取首帖（礼金金额定义在首帖的 [gift=M] 中）
  const firstPost = await queryOne<{ id: number; articlecontent: string; usrid: number }>(
    "SELECT id, articlecontent, usrid FROM posts WHERE tid = $1 ORDER BY id LIMIT 1",
    [post.tid]
  );

  try {
    if (action === "buy") {
      const sellmoney = parseIntTag(post.articlecontent, "sell");
      if (sellmoney <= 0) return fail("本帖不是出售帖或出售参数有误");
      if (isAuthor) return fail("不能购买自己出售的内容");

      const buyers = post.sellbuyer.split(",").filter(Boolean).map(Number);
      if (buyers.includes(viewer.userid)) return fail("您已经购买过此内容，无需重复购买");
      if (viewer.money < sellmoney) return fail(`您的金钱不足（需要 ${sellmoney}）`);

      const begId = `${post.id}1`;
      const result = await transaction(async (c) => {
        // 扣买家（余额护栏）
        const dec = await c.query<{ money: number }>(
          "UPDATE userlist SET money = money - $1 WHERE userid = $2 AND money >= $1 RETURNING money",
          [sellmoney, viewer.userid]
        );
        if (!dec.rows[0]) throw new Error("您的金钱不足（需要 " + sellmoney + "）");
        // 加作者
        await c.query("UPDATE userlist SET money = money + $1 WHERE userid = $2", [sellmoney, post.usrid]);
        // 记买家
        const sellbuyer = post.sellbuyer ? `${post.sellbuyer},${viewer.userid}` : String(viewer.userid);
        await c.query("UPDATE posts SET sellbuyer = $1 WHERE id = $2", [sellbuyer, post.id]);
        // beg 流水
        const row = await c.query<{ beglog: string; giftid: string; begers: number; begmoneys: number }>(
          "SELECT beglog, giftid, begers, begmoneys FROM beg WHERE id = $1 FOR UPDATE",
          [begId]
        );
        const giftid = row.rows[0]
          ? `${viewer.userid}|${sellmoney},${row.rows[0].giftid}`
          : `${viewer.userid}|${sellmoney}`;
        await c.query(
          `INSERT INTO beg (id, tid, beglog, giftid, begers, begmoneys)
           VALUES ($1, $2, $3, $4, 1, $5)
           ON CONFLICT (id) DO UPDATE SET beglog = EXCLUDED.beglog, giftid = EXCLUDED.giftid,
             begers = beg.begers + 1, begmoneys = beg.begmoneys + EXCLUDED.begmoneys`,
          [begId, post.tid, row.rows[0] ? `${row.rows[0].beglog},${viewer.username}` : viewer.username, giftid, sellmoney]
        );
        return { money: dec.rows[0].money };
      });
      return ok({ money: result.money, message: `购买成功，已支付 ${sellmoney} 金钱` });
    }

    if (action === "refund") {
      if (!isAuthor && !auth.isAdmin) return fail("只有帖子作者可以退款");
      const begId = `${post.id}1`;
      const row = await queryOne<{ giftid: string; begmoneys: number }>("SELECT giftid, begmoneys FROM beg WHERE id = $1", [
        begId,
      ]);
      if (!row) return fail("此帖没有需要退还的款项");

      const result = await transaction(async (c) => {
        const entries = row.giftid.split(",").filter(Boolean);
        let delMoney = 0;
        for (const entry of entries) {
          const [uidStr, amountStr] = entry.split("|");
          const uid = Number(uidStr);
          const amount = Number(amountStr);
          if (Number.isInteger(uid) && uid > 0 && Number.isInteger(amount) && amount > 0) {
            await c.query("UPDATE userlist SET money = money + $1 WHERE userid = $2", [amount, uid]);
            delMoney += amount;
          }
        }
        const dec = await c.query<{ money: number }>(
          "UPDATE userlist SET money = money - $1 WHERE userid = $2 AND money >= $1 RETURNING money",
          [delMoney, post.usrid]
        );
        if (!dec.rows[0]) throw new Error("作者金钱不足以完成退款");
        await c.query("DELETE FROM beg WHERE id = $1", [begId]);
        await c.query("UPDATE posts SET sellbuyer = '' WHERE id = $1", [post.id]);
        // 退款记录写入管理日志（复刻原版 actioncode=refund）
        await c.query(
          "INSERT INTO actlogs (actdetail, acter, actreason, acttime, forumid, actioncode) VALUES ($1, $2, '', $3, $4, 'refund')",
          [`${post.username} 的帖子 #${post.id}（${thread.title}）`, viewer.username, Math.floor(Date.now() / 1000), post.tid]
        );
        return { money: dec.rows[0].money };
      });
      return ok({ money: result.money, message: "退款成功，所有买家已退还付款" });
    }

    if (action === "gift") {
      if (!isStarter) return fail("您不是发帖者，不能发放礼金");
      if (!firstPost) return fail("礼金参数有误");
      const giftmoney = parseIntTag(firstPost.articlecontent, "gift");
      if (giftmoney <= 0) return fail("礼金帖参数有误");
      if (viewer.money < giftmoney) return fail(`您已经没有钱再发礼金了！（需 ${giftmoney}）`);
      if (post.usrid === viewer.userid) return fail("这是您自己的回复，无需发放礼金");

      const begId = `${post.tid}2`;
      const row = await queryOne<{ giftid: string }>("SELECT giftid FROM beg WHERE id = $1", [begId]);
      const receivers = row ? row.giftid.split(",").filter(Boolean).map(Number) : [];
      if (receivers.includes(post.usrid)) return fail("该用户已经收到过礼金");

      const result = await transaction(async (c) => {
        const dec = await c.query<{ money: number }>(
          "UPDATE userlist SET money = money - $1 WHERE userid = $2 AND money >= $1 RETURNING money",
          [giftmoney, viewer.userid]
        );
        if (!dec.rows[0]) throw new Error(`您已经没有钱再发礼金了！（需 ${giftmoney}）`);
        await c.query("UPDATE userlist SET money = money + $1 WHERE userid = $2", [giftmoney, post.usrid]);
        const newGiftid = row ? `${row.giftid},${post.usrid}` : String(post.usrid);
        await c.query(
          `INSERT INTO beg (id, tid, beglog, giftid, begers, begmoneys)
           VALUES ($1, $2, $3, $4, 1, $5)
           ON CONFLICT (id) DO UPDATE SET beglog = beg.beglog || ',' || EXCLUDED.beglog,
             giftid = EXCLUDED.giftid, begers = beg.begers + 1, begmoneys = beg.begmoneys + EXCLUDED.begmoneys`,
          [begId, post.tid, post.username, newGiftid, giftmoney]
        );
        return { money: dec.rows[0].money };
      });
      return ok({ money: result.money, message: `礼金发放成功，${post.username} 收到 ${giftmoney} 金钱` });
    }

    if (action === "beg") {
      if (isAuthor) return fail("不能自己给自己捐钱");
      const begmoney = Math.floor(Number(body.begmoney));
      if (!Number.isInteger(begmoney) || begmoney <= 0) return fail("您输入的金钱数有误，请输入正整数");
      if (viewer.money < begmoney) return fail(`您的金钱不足以捐助（需 ${begmoney}）`);

      const begId = `${post.id}3`;
      const row = await queryOne<{ giftid: string; begers: number }>("SELECT giftid, begers FROM beg WHERE id = $1", [
        begId,
      ]);
      const donors = row ? row.giftid.split(",").filter(Boolean).map(Number) : [];
      const firstTime = !donors.includes(viewer.userid);
      const begers = (row?.begers ?? 0) + (firstTime ? 1 : 0);
      const giftid = row ? (firstTime ? `${row.giftid},${viewer.userid}` : row.giftid) : String(viewer.userid);

      const result = await transaction(async (c) => {
        const dec = await c.query<{ money: number }>(
          "UPDATE userlist SET money = money - $1 WHERE userid = $2 AND money >= $1 RETURNING money",
          [begmoney, viewer.userid]
        );
        if (!dec.rows[0]) throw new Error(`您的金钱不足以捐助（需 ${begmoney}）`);
        await c.query("UPDATE userlist SET money = money + $1 WHERE userid = $2", [begmoney, post.usrid]);
        const beglogEntry = `${viewer.username}|${begmoney}`;
        await c.query(
          `INSERT INTO beg (id, tid, beglog, giftid, begers, begmoneys)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET beglog = beg.beglog || ',' || EXCLUDED.beglog,
             giftid = EXCLUDED.giftid, begers = EXCLUDED.begers, begmoneys = beg.begmoneys + EXCLUDED.begmoneys`,
          [begId, post.tid, beglogEntry, giftid, begers, begmoney]
        );
        return { money: dec.rows[0].money };
      });
      return ok({ money: result.money, message: `捐助成功，已向 ${post.username} 捐助 ${begmoney} 金钱` });
    }

    return fail("未知的交易类型");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "交易失败";
    return fail(msg);
  }
}
