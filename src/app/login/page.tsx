import NaviBar from "@/components/bmf/navi-bar";
import AuthForm from "@/components/bmf/auth-form";

export const metadata = { title: "会员登录" };

export default function LoginPage() {
  return (
    <main>
      <NaviBar crumbs={[{ name: "论坛首页", href: "/" }, { name: "会员登录" }]} />
      <AuthForm mode="login" />
    </main>
  );
}
