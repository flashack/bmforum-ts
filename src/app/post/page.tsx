import { redirect, notFound } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getForumList } from "@/lib/queries";
import { queryOne } from "@/lib/db";
import NaviBar from "@/components/bmf/navi-bar";
import PostEditor from "@/components/bmf/post-editor";

export const dynamic = "force-dynamic";

export default async function PostPage({
  searchParams,
}: {
  searchParams: Promise<{ forumid?: string; replyto?: string; quote?: string }>;
}) {
  const sp = await searchParams;
  const auth = await getAuth();
  if (!auth.user) redirect("/login");

  const all = await getForumList();
  const forums = all.filter((f) => f.type === "forum").map((f) => ({ id: f.id, bbsname: f.bbsname }));

  const replyto = sp.replyto ? Number(sp.replyto) : undefined;
  const quoteId = sp.quote ? Number(sp.quote) : undefined;

  let quoteTitle: string | undefined;
  let quoteContent: string | undefined;
  let quoteAuthor: string | undefined;
  let defaultForumId = sp.forumid ? Number(sp.forumid) : undefined;

  if (typeof replyto === "number") {
    const t = await queryOne<{ title: string; forumid: number }>(
      "SELECT title, forumid FROM threads WHERE tid = $1",
      [replyto]
    );
    if (!t) notFound();
    quoteTitle = t.title;
    defaultForumId = t.forumid;
    if (typeof quoteId === "number") {
      const post = await queryOne<{ articlecontent: string; username: string }>(
        "SELECT articlecontent, username FROM posts WHERE id = $1 AND tid = $2",
        [quoteId, replyto]
      );
      if (post) {
        quoteContent = post.articlecontent;
        quoteAuthor = post.username;
      }
    }
  }

  return (
    <main>
      <NaviBar
        crumbs={[
          { name: "论坛首页", href: "/" },
          { name: replyto ? "回复主题" : "发表新主题" },
        ]}
      />
      <PostEditor
        forums={forums}
        defaultForumId={defaultForumId}
        replyTo={replyto}
        quoteTitle={quoteTitle}
        quoteContent={quoteContent}
        quoteAuthor={quoteAuthor}
        canUpload={!!auth.user && auth.user.canupload === 1}
      />
    </main>
  );
}
