import Link from "next/link";
import NaviBar from "@/components/bmf/navi-bar";

export const metadata = { title: "帮助" };

const FAQS: { q: string; a: string }[] = [
  {
    q: "如何注册成为会员？",
    a: "点击页面右上角的「立即注册」，填写用户名、邮箱和密码即可完成注册。注册后即可发帖、回帖、参与投票和使用短消息。",
  },
  {
    q: "如何发表新主题？",
    a: "进入目标版块，点击「发表新主题」按钮。填写标题与内容后提交。可以添加「随意贴」标签（Tag）方便他人搜索，也可以创建投票。",
  },
  {
    q: "什么是 BMB 代码？",
    a: "BMB 代码是本论坛使用的轻量标记语法，类似 HTML 但更安全。常用格式：[b]加粗[/b]、[i]斜体[/i]、[u]下划线[/u]、[url=链接]文字[/url]、[img]图片地址[/img]、[quote]引用[/quote]、[code]代码[/code]、[color=red]颜色[/color]、[size=5]字号[/size]。",
  },
  {
    q: "什么是主题随意贴？",
    a: "随意贴（Tag）是 BMForum 的特色功能：发表主题时可以给帖子打上 1~3 个标签，其他会员通过标签云即可快速找到同类的主题。",
  },
  {
    q: "如何使用短消息？",
    a: "登录后进入「短消息」，可以撰写消息发给其他会员，对方登录后会在收件箱看到未读提醒。",
  },
  {
    q: "积分与金币如何获得？",
    a: "每发表一个主题或回复都会增加发帖数与积分；被版主加分、参与活动也可以获得金币。积分代表活跃度，金币可在社区中流通。",
  },
  {
    q: "忘记密码怎么办？",
    a: "请联系管理员重置密码，或在注册时填写真实邮箱以便找回。",
  },
];

export default function FaqPage() {
  return (
    <main>
      <NaviBar crumbs={[{ name: "论坛首页", href: "/" }, { name: "帮助" }]} />
      <div className="bmf-table-box">
        <div className="bmf-table-header">常见问题解答</div>
        {FAQS.map((f, i) => (
          <div key={i} className="bmf-row">
            <div className="mb-1 text-[13px] font-bold text-[#336699]">
              {i + 1}. {f.q}
            </div>
            <div className="bmf-article text-[13px]">{f.a}</div>
          </div>
        ))}
      </div>
      <p className="pb-4 text-center text-xs text-[#999]">
        还有其他问题？进入 <Link href="/forums/1" className="text-[#3083be]">站务公告区</Link> 向管理员提问。
      </p>
    </main>
  );
}
