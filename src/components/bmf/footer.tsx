import Link from "next/link";

export default function Footer({ footerText }: { footerText: string }) {
  return (
    <div className="mt-4 border-t border-[#dddddd] py-4 text-center text-xs text-[#999]">
      <div className="mb-1">
        <Link href="/faq">联系我们</Link>
        <span className="mx-1">|</span>
        <Link href="/userlist">会员列表</Link>
        <span className="mx-1">|</span>
        <Link href="/search">搜索</Link>
        <span className="mx-1">|</span>
        <a href="#top">回到页面顶部</a>
      </div>
      <div>{footerText}</div>
    </div>
  );
}
