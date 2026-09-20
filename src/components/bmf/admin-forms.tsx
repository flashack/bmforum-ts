"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminForms() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const [catName, setCatName] = useState("");
  const [forumName, setForumName] = useState("");
  const [forumCat, setForumCat] = useState("");
  const [forumDesc, setForumDesc] = useState("");
  const [forumMods, setForumMods] = useState("");
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [msg, setMsg] = useState("");

  async function post(url: string, body: Record<string, string>, okMsg: string, reset: () => void) {
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setMsg(data.error || "操作失败");
        return;
      }
      setMsg(okMsg);
      reset();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const label = "bmf-label";
  return (
    <div className="grid gap-5 p-4 text-[13px]">
      {msg && <div className="rounded border border-[#bcd4e6] bg-[#eef4fa] px-3 py-2 text-xs text-[#336699]">{msg}</div>}

      <section>
        <h3 className="mb-2 font-bold text-[#336699]">添加论坛分类</h3>
        <div className="flex items-end gap-2">
          <div>
            <span className={label}>分类名称</span>
            <input className="bmf-input !w-64" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="如：休闲娱乐" />
          </div>
          <button
            type="button"
            disabled={busy || !catName.trim()}
            onClick={() =>
              post("/api/admin/forums", { action: "create", type: "category", name: catName }, "分类已添加。", () => setCatName(""))
            }
            className="bmf-btn bmf-btn-primary disabled:opacity-50"
          >
            添加分类
          </button>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-bold text-[#336699]">添加论坛版块</h3>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <span className={label}>所属分类</span>
            <input className="bmf-input !w-44" value={forumCat} onChange={(e) => setForumCat(e.target.value)} placeholder="分类 ID（见下方列表）" />
          </div>
          <div>
            <span className={label}>版块名称</span>
            <input className="bmf-input !w-56" value={forumName} onChange={(e) => setForumName(e.target.value)} />
          </div>
          <div>
            <span className={label}>版块描述</span>
            <input className="bmf-input !w-72" value={forumDesc} onChange={(e) => setForumDesc(e.target.value)} />
          </div>
          <div>
            <span className={label}>版主（逗号分隔）</span>
            <input className="bmf-input !w-56" value={forumMods} onChange={(e) => setForumMods(e.target.value)} placeholder="如：admin,张三" />
          </div>
          <button
            type="button"
            disabled={busy || !forumName.trim() || !forumCat}
            onClick={() =>
              post(
                "/api/admin/forums",
                { action: "create", type: "forum", name: forumName, description: forumDesc, categoryId: forumCat, moderators: forumMods },
                "版块已添加。",
                () => {
                  setForumName("");
                  setForumDesc("");
                  setForumMods("");
                }
              )
            }
            className="bmf-btn bmf-btn-primary disabled:opacity-50"
          >
            添加版块
          </button>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-bold text-[#336699]">发布公告</h3>
        <div className="grid max-w-2xl gap-2">
          <div>
            <span className={label}>公告标题</span>
            <input className="bmf-input" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} />
          </div>
          <div>
            <span className={label}>公告内容</span>
            <textarea className="bmf-input font-sans" rows={4} value={annContent} onChange={(e) => setAnnContent(e.target.value)} />
          </div>
          <div className="text-right">
            <button
              type="button"
              disabled={busy || !annTitle.trim()}
              onClick={() => post("/api/admin/announce", { title: annTitle, content: annContent }, "公告已发布。", () => { setAnnTitle(""); setAnnContent(""); })}
              className="bmf-btn bmf-btn-primary disabled:opacity-50"
            >
              发布公告
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
