import { redirect, notFound } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getForumList } from "@/lib/queries";
import { queryOne } from "@/lib/db";
import NaviBar from "@/components/bmf/navi-bar";
import PostEditor from "@/components/bmf/post-editor";

export const dynamic = "force-dynamic";

/** 取主题的首帖 id（用于判断是否在编辑主楼） */
async function firstPostId(tid: number): Promise<number | null> {
  const r = await queryOne<{ id: number }>("SELECT id FROM posts WHERE tid = $1 ORDER BY id LIMIT 1", [tid]);
  return r?.id ?? null;
}

export default async function PostPage({
  searchParams,
}: {
  searchParams: Promise<{ forumid?: string; replyto?: string; quote?: string; edit?: string }>;
}) {
  const sp = await searchParams;
  const auth = await getAuth();
  if (!auth.user) redirect("/login");

  const all = await getForumList();
  const forums = all.filter((f) => f.type === "forum").map((f) => ({ id: f.id, bbsname: f.bbsname }));

  const replyto = sp.replyto ? Number(sp.replyto) : undefined;
  const quoteId = sp.quote ? Number(sp.quote) : undefined;
  const editPid = sp.edit ? Number(sp.edit) : undefined;

  let quoteTitle: string | undefined;
  let quoteContent: string | undefined;
  let quoteAuthor: string | undefined;
  let defaultForumId = sp.forumid ? Number(sp.forumid) : undefined;

  // ===== 编辑模式（post.php modify）=====
  if (typeof editPid === "number" && Number.isInteger(editPid)) {
    const post = await queryOne<{
      id: number;
      tid: number;
      articlecontent: string;
      usrid: number;
      forumid: number;
    }>("SELECT id, tid, articlecontent, usrid, forumid FROM posts WHERE id = $1", [editPid]);
    if (!post) notFound();
    const thread = await queryOne<{ tid: number; authorid: number; islock: number }>(
      "SELECT tid, authorid, islock FROM threads WHERE tid = $1 AND ttrash = 0",
      [post.tid]
    );
    if (!thread) notFound();
    const isFirst = post.id === (await firstPostId(post.tid));
    const canEdit =
      auth.user.userid === post.usrid || auth.user.userid === thread.authorid || auth.isAdmin;
    if (!canEdit) {
      return (
        <main>
          <NaviBar crumbs={[{ name: "论坛首页", href: "/" }, { name: "编辑帖子" }]} />
          <div className="bmf-table-box">
            <div className="bmf-table-header">
              <span>提示信息</span>
            </div>
            <div className="bmf-row text-xs">您没有权限编辑该帖子。</div>
          </div>
        </main>
      );
    }
    if (thread.islock === 1 && !auth.isAdmin && !auth.isMod) {
      return (
        <main>
          <NaviBar crumbs={[{ name: "论坛首页", href: "/" }, { name: "编辑帖子" }]} />
          <div className="bmf-table-box">
            <div className="bmf-table-header">
              <span>提示信息</span>
            </div>
            <div className="bmf-row text-xs">主题已被锁定，无法编辑。</div>
          </div>
        </main>
      );
    }
    const th = isFirst
      ? await queryOne<{ title: string; ttagname: string; newdesc: string }>(
          "SELECT title, ttagname, newdesc FROM threads WHERE tid = $1",
          [post.tid]
        )
      : null;
    return (
      <main>
        <NaviBar crumbs={[{ name: "论坛首页", href: "/" }, { name: "编辑帖子" }]} />
        <PostEditor
          forums={forums}
          editPid={editPid}
          editTid={post.tid}
          editIsFirst={isFirst}
          editTitle={th?.title}
          editTags={th?.ttagname ?? ""}
          editNewdesc={th?.newdesc ?? ""}
          editContent={post.articlecontent}
          canUpload={auth.user.canupload === 1}
        />
      </main>
    );
  }

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
