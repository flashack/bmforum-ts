import { NextRequest } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { num, readBody, ok, fail } from "@/lib/api";
import { getAuth } from "@/lib/auth";

interface PollOption {
  text: string;
  votes: number;
}

/** POST /api/threads/[tid]/vote —— 投票 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ tid: string }> }) {
  const { tid: tidStr } = await params;
  const tid = Number(tidStr);
  const auth = await getAuth();
  if (!auth.user) return fail("请先登录后再投票");
  if (!auth.user.canvote) return fail("您所在的用户组无权参与投票", 403);

  const thread = await queryOne<{ islock: number }>("SELECT islock FROM threads WHERE tid = $1", [tid]);
  if (!thread) return fail("主题不存在");
  if (thread.islock === 1 || thread.islock === 3) return fail("主题已被锁定，无法投票");

  const poll = await queryOne<{
    options: PollOption[];
    polluser: number[] | Record<string, unknown> | string;
    maxchoose: number;
    deadline: number;
    minposts: number;
  }>("SELECT options, polluser, maxchoose, deadline, minposts FROM polls WHERE tid = $1", [tid]);
  if (!poll) return fail("该主题没有投票");

  const now = Math.floor(Date.now() / 1000);
  if (poll.deadline > 0 && now > poll.deadline) return fail("投票已截止，无法再投");
  if (poll.minposts > 0 && auth.user.postamount < poll.minposts) {
    return fail(`您的发帖数需达到 ${poll.minposts} 才能参与投票`);
  }

  const options: PollOption[] = poll.options;
  // polluser 兼容数组 / 对象 / 字符串
  const rawPolluser = typeof poll.polluser === "string" ? JSON.parse(poll.polluser || "[]") : poll.polluser;
  const votedUsers: number[] = Array.isArray(rawPolluser) ? rawPolluser.map(Number) : [];

  if (votedUsers.includes(auth.user.userid)) return fail("您已经投过票了");

  const body = await readBody(req);
  const rawChoices = Array.isArray(body.choices) ? body.choices : [body.choice];
  const choices = rawChoices
    .map((c) => Number(c))
    .filter((c) => Number.isInteger(c) && c >= 0 && c < options.length);
  if (choices.length === 0) return fail("请选择投票项");
  const maxChoose = poll.maxchoose || 1;
  if (choices.length > maxChoose) return fail(`最多可选择 ${maxChoose} 项`);

  for (const idx of choices) options[idx].votes += 1;
  votedUsers.push(auth.user.userid);

  await execute("UPDATE polls SET options = $2::jsonb, polluser = $3::jsonb WHERE tid = $1", [
    tid,
    JSON.stringify(options),
    JSON.stringify([...new Set(votedUsers)]),
  ]);
  return ok();
}
