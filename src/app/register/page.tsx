import NaviBar from "@/components/bmf/navi-bar";
import AuthForm from "@/components/bmf/auth-form";

export const metadata = { title: "注册会员" };

export default function RegisterPage() {
  return (
    <main>
      <NaviBar crumbs={[{ name: "论坛首页", href: "/" }, { name: "注册会员" }]} />
      <AuthForm mode="register" />
    </main>
  );
}
