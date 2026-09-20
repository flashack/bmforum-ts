import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { getAuth } from "@/lib/auth";
import { getSiteConfig } from "@/lib/queries";
import Navbar from "@/components/bmf/navbar";
import Footer from "@/components/bmf/footer";

export const metadata: Metadata = {
  title: {
    default: "BMForum 7 - 论坛",
    template: "%s - BMForum 7",
  },
  description: "基于 TypeScript + PostgreSQL 复刻的经典 BMForum 论坛系统",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [auth, config] = await Promise.all([getAuth(), getSiteConfig()]);
  const styleCookie = (await cookies()).get("bmf_style")?.value;
  const bmfStyle = styleCookie === "green" || styleCookie === "wine" ? styleCookie : undefined;
  return (
    <html lang="zh-CN" data-bmf-style={bmfStyle}>
      <body className="antialiased bg-white pt-10">
        <Navbar
          user={
            auth.user
              ? {
                  userid: auth.user.userid,
                  username: auth.user.username,
                  usergroup: auth.user.usergroup,
                  newmess: auth.user.newmess,
                }
              : null
          }
          isAdmin={auth.isAdmin}
          boardTitle={config.bbstitle}
        />
        <div className="bmf-wrap" id="top">
          {children}
          <Footer footerText={config.footer} />
        </div>
      </body>
    </html>
  );
}
