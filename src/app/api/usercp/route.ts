import { NextRequest } from "next/server";
import { query, queryOne, execute } from "@/lib/db";
import { str, num, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";

/** POST /api/usercp —— 更新个人资料 */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录");
  const body = await readBody(req);

  const signtext = str(body, "signtext", 200);
  const homepage = str(body, "homepage", 200);
  const fromwhere = str(body, "fromwhere", 100);
  const rawSex = str(body, "sex", 10);
  const sex = rawSex === "男" || rawSex === "女" ? rawSex : "";
  const birthday = str(body, "birthday", 20);
  const mailadd = str(body, "mailadd", 100);
  const avatar = str(body, "avatar", 300);

  if (mailadd && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailadd)) return fail("邮箱格式不正确");

  await execute(
    `UPDATE userlist SET signtext = $2, homepage = $3, fromwhere = $4, sex = $5,
            birthday = $6, mailadd = $7, avatar = $8 WHERE userid = $1`,
    [auth.user.userid, signtext, homepage, fromwhere, sex, birthday, mailadd, avatar]
  );
  return ok();
}
