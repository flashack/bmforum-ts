"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { parseBmbCode, EMOTICONS } from "@/lib/bmbcode";

export interface EditorForum {
  id: number;
  bbsname: string;
}

export default function PostEditor({
  forums,
  defaultForumId,
  replyTo,
  quoteTitle,
  quoteContent,
  quoteAuthor,
  canUpload,
  editPid,
  editTid,
  editIsFirst,
  editTitle,
  editTags,
  editNewdesc,
  editContent,
}: {
  forums: EditorForum[];
  defaultForumId?: number;
  replyTo?: number;
  quoteTitle?: string;
  quoteContent?: string;
  quoteAuthor?: string;
  canUpload?: boolean;
  editPid?: number;
  editTid?: number;
  editIsFirst?: boolean;
  editTitle?: string;
  editTags?: string;
  editNewdesc?: string;
  editContent?: string;
}) {
  const isReply = typeof replyTo === "number";
  const isEdit = typeof editPid === "number";
  const showThreadFields = (isEdit && editIsFirst) || !isReply;
  const router = useRouter();
  const [forumid, setForumid] = useState<number>(defaultForumId ?? forums[0]?.id ?? 0);
  const [title, setTitle] = useState(editTitle ?? (quoteTitle ? `RE: ${quoteTitle}` : ""));
  const [tags, setTags] = useState(editTags ?? "");
  const [newdesc, setNewdesc] = useState(editNewdesc ?? "");
  const [content, setContent] = useState(
    editContent ??
      (quoteContent ? `[quote=${quoteAuthor ?? ""}]${quoteContent.slice(0, 500)}[/quote]\n` : "")
  );
  const [pollText, setPollText] = useState("");
  const [pollType, setPollType] = useState<"s" | "m">("s");
  const [pollMax, setPollMax] = useState(2);
  const [viewAfter, setViewAfter] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [minPosts, setMinPosts] = useState(0);
  // 交易设置（原版 post.php assell/asgift/asbeg 复选框，提交时自动包裹标签）
  const [asSell, setAsSell] = useState(false);
  const [sellMoney, setSellMoney] = useState("");
  const [asGift, setAsGift] = useState(false);
  const [giftMoney, setGiftMoney] = useState("");
  const [asBeg, setAsBeg] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const [showEmot, setShowEmot] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachMsg, setAttachMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function insert(left: string, right = "") {
    const el = areaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = content.slice(0, start) + left + content.slice(start, end) + right + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + left.length;
      el.selectionEnd = end + left.length;
    });
  }

  async function uploadAttachment() {
    const file = fileRef.current?.files?.[0];
    setAttachMsg("");
    if (!file) {
      setAttachMsg("请先选择文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAttachMsg("附件不能超过 5MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tid", String(replyTo ?? 0));
      const res = await fetch("/api/attachment", { method: "POST", body: fd });
      const data = (await res.json()) as { ok: boolean; id?: number; error?: string };
      if (!data.ok || !data.id) {
        setAttachMsg(data.error || "上传失败");
        return;
      }
      insert(`[attach=${data.id}]`);
      setAttachMsg(`已上传：${file.name}`);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setMsg("");
    if (!isReply && !forumid) {
      setMsg("请选择版块");
      return;
    }
    if (!isReply && !title.trim()) {
      setMsg("请填写标题");
      return;
    }
    if (!content.trim()) {
      setMsg("请填写内容");
      return;
    }
    // 交易包裹（复刻原版顺序：[pay=] 最内 → [gift=] → [beg] 最外）
    let finalContent = content;
    if (asSell && /^\d{1,9}$/.test(sellMoney)) finalContent = `[pay=${sellMoney}]${finalContent}[/pay]`;
    if (asGift && /^\d{1,9}$/.test(giftMoney)) finalContent = `[gift=${giftMoney}]${finalContent}[/gift]`;
    if (asBeg) finalContent = `[beg]${finalContent}[/beg]`;
    setBusy(true);
    try {
      if (isEdit && typeof editPid === "number") {
        const res = await fetch(`/api/posts/${editPid}/edit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            ...(editIsFirst ? { title, tags, newdesc } : {}),
          }),
        });
        const data = (await res.json()) as { ok: boolean; error?: string };
        if (!data.ok) {
          setMsg(data.error || "保存失败");
          return;
        }
        router.push(`/topic/${editTid ?? replyTo ?? 0}`);
        router.refresh();
        return;
      }
      if (isReply && typeof replyTo === "number") {
        const res = await fetch(`/api/threads/${replyTo}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: finalContent }),
        });
        const data = (await res.json()) as { ok: boolean; error?: string };
        if (!data.ok) {
          setMsg(data.error || "回复失败");
          return;
        }
        router.push(`/topic/${replyTo}`);
        router.refresh();
        return;
      }
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forumid,
          title,
          content: finalContent,
          tags,
          pollOptions: pollText
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean),
          pollType,
          pollMax: Math.max(2, Math.min(20, pollMax || 2)),
          viewAfter: viewAfter ? 1 : 0,
          deadline: deadlineDate ? Math.floor(new Date(`${deadlineDate}T23:59:59`).getTime() / 1000) : 0,
          minposts: Math.max(0, Math.min(99999, minPosts || 0)),
        }),
      });
      const data = (await res.json()) as { ok: boolean; tid?: number; error?: string };
      if (!data.ok) {
        setMsg(data.error || "发布失败");
        return;
      }
      if (typeof data.tid === "number") router.push(`/topic/${data.tid}`);
    } finally {
      setBusy(false);
    }
  }

  const TOOLBAR: [string, string, string][] = [
    ["加粗", "[b]", "[/b]"],
    ["斜体", "[i]", "[/i]"],
    ["下划线", "[u]", "[/u]"],
    ["删除线", "[s]", "[/s]"],
    ["引用", "[quote]", "[/quote]"],
    ["代码", "[code]", "[/code]"],
    ["链接", "[url=https://]", "[/url]"],
    ["图片", "[img]", "[/img]"],
    ["列表", "[list=1][*]项", "[/list]"],
    ["居中", "[center]", "[/center]"],
    ["分割线", "[hr]", ""],
    ["出售", "[sell=10]", "[/sell]"],
    ["礼金", "[gift=10]", "[/gift]"],
    ["求赏", "[beg]", "[/beg]"],
  ];

  return (
    <div className="bmf-table-box">
      <div className="bmf-table-header">
        <span>{isEdit ? "编辑帖子" : isReply ? `回复主题：${quoteTitle ?? ""}` : "发表新主题"}</span>
      </div>
      <div className="bmf-row">
        <div className="grid gap-3">
          {!isReply && !isEdit && (
            <div className="grid grid-cols-[90px_1fr] items-center gap-2">
              <span className="bmf-label !mb-0 text-right">发表版块</span>
              <select className="bmf-input !w-64" value={forumid} onChange={(e) => setForumid(Number(e.target.value))}>
                {forums.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.bbsname}
                  </option>
                ))}
              </select>
            </div>
          )}
          {showThreadFields && (
            <div className="grid grid-cols-[90px_1fr] items-center gap-2">
              <span className="bmf-label !mb-0 text-right">主题标题</span>
              <input
                className="bmf-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入主题标题（必填）"
                maxLength={100}
              />
            </div>
          )}
          {showThreadFields && (
            <div className="grid grid-cols-[90px_1fr] items-center gap-2">
              <span className="bmf-label !mb-0 text-right">Tags 标签</span>
              <input
                className="bmf-input"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="用逗号或空格分隔，最多 5 个，如：PostgreSQL, 复刻"
              />
            </div>
          )}
          {showThreadFields && (
            <div className="grid grid-cols-[90px_1fr] items-center gap-2">
              <span className="bmf-label !mb-0 text-right">主题简介</span>
              <input
                className="bmf-input"
                value={newdesc}
                onChange={(e) => setNewdesc(e.target.value)}
                placeholder="可选。将显示在版块主题列表的标题下方"
                maxLength={200}
              />
            </div>
          )}
          <div className="grid grid-cols-[90px_1fr] items-start gap-2">
            <span className="bmf-label !mb-0 pt-2 text-right">帖子内容</span>
            <div>
              <div className="mb-1 flex flex-wrap gap-1">
                {TOOLBAR.map(([label, l, r]) => (
                  <button key={label} type="button" className="bmf-btn !py-0.5 !text-xs" onClick={() => insert(l, r)}>
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  className="bmf-btn !py-0.5 !text-xs"
                  onClick={() => insert("[color=red]", "[/color]")}
                >
                  红色
                </button>
                <button
                  type="button"
                  className="bmf-btn !py-0.5 !text-xs"
                  onClick={() => insert("[size=4]", "[/size]")}
                >
                  大字
                </button>
                <button
                  type="button"
                  className="bmf-btn !py-0.5 !text-xs"
                  onClick={() => setShowEmot(!showEmot)}
                >
                  表情
                </button>
              </div>
              {showEmot && (
                <div className="bmf-emot-panel">
                  {EMOTICONS.map((e) => (
                    <button
                      key={e.file}
                      type="button"
                      title={e.name}
                      onClick={() => insert(`[s:${e.file.replace(".gif", "")}]`)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/face/${e.file}`} alt={e.name} width={28} height={28} />
                    </button>
                  ))}
                </div>
              )}
              <textarea
                ref={areaRef}
                className="bmf-input font-sans"
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="支持 BMBCode：[b]加粗[/b] [quote]引用[/quote] [code]代码[/code] [img]图片[/img] [url=https://...]链接[/url]，交易标签：[sell=金额]出售内容[/sell] [gift=金额]礼金[/gift] [beg]求赏[/beg]，表情 [s:icon1100]"
              />
              {canUpload && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <input ref={fileRef} type="file" className="text-xs" />
                  <button type="button" className="bmf-btn !py-0.5" onClick={uploadAttachment} disabled={uploading}>
                    {uploading ? "上传中..." : "上传附件"}
                  </button>
                  <span className="text-[#999999]">≤5MB，上传后自动插入 [attach] 标记</span>
                  {attachMsg && <span className="text-[#336699]">{attachMsg}</span>}
                </div>
              )}
              <div className="mt-1 flex gap-2 text-xs">
                <button type="button" className="bmf-btn !py-0.5" onClick={() => setPreview(!preview)}>
                  {preview ? "关闭预览" : "预览内容"}
                </button>
              </div>
              {preview && (
                <div
                  className="bmf-article mt-2 border border-[#dddddd] bg-[#fbfbfb] p-3"
                  dangerouslySetInnerHTML={{ __html: parseBmbCode(content) }}
                />
              )}
            </div>
          </div>
          {!isReply && !isEdit && (
            <div className="grid grid-cols-[90px_1fr] items-start gap-2">
              <span className="bmf-label !mb-0 text-right">发起投票</span>
              <div>
                <textarea
                  className="bmf-input font-sans"
                  rows={3}
                  value={pollText}
                  onChange={(e) => setPollText(e.target.value)}
                  placeholder={"可选。每行一个投票选项（至少 2 行）发起投票，如：\nDiscuz!\nPHPWind\nBMForum"}
                />
                {pollText.trim() && (
                  <div className="mt-2 grid max-md:grid-cols-1 grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#444]">
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={pollType === "s"} onChange={() => setPollType("s")} className="accent-[#3083be]" />
                      单选
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={pollType === "m"} onChange={() => setPollType("m")} className="accent-[#3083be]" />
                      多选，最多可选
                      <input
                        type="number"
                        min={2}
                        max={20}
                        value={pollMax}
                        onChange={(e) => setPollMax(Number(e.target.value))}
                        disabled={pollType !== "m"}
                        className="bmf-input !w-14 !py-0.5 !text-xs"
                      />
                      项
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={viewAfter} onChange={(e) => setViewAfter(e.target.checked)} className="accent-[#3083be]" />
                      投票后才能查看结果
                    </label>
                    <label className="flex items-center gap-2">
                      到期日期
                      <input
                        type="date"
                        value={deadlineDate}
                        onChange={(e) => setDeadlineDate(e.target.value)}
                        className="bmf-input !w-36 !py-0.5 !text-xs"
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      最低发帖数
                      <input
                        type="number"
                        min={0}
                        value={minPosts}
                        onChange={(e) => setMinPosts(Number(e.target.value))}
                        className="bmf-input !w-20 !py-0.5 !text-xs"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* 交易设置（原版 post.php 出售/礼金/求赏复选框） */}
          {!isEdit && (
            <div className="grid grid-cols-[90px_1fr] items-start gap-2">
              <span className="bmf-label !mb-0 text-right">交易设置</span>
              <div className="grid grid-cols-1 gap-1 text-xs text-[#444] md:grid-cols-3">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={asSell} onChange={(e) => setAsSell(e.target.checked)} className="accent-[#3083be]" />
                  出售
                  <input
                    type="number"
                    min={0}
                    placeholder="金额"
                    value={sellMoney}
                    onChange={(e) => setSellMoney(e.target.value)}
                    disabled={!asSell}
                    className="bmf-input !w-16 !py-0.5 !text-xs"
                  />
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={asGift} onChange={(e) => setAsGift(e.target.checked)} className="accent-[#3083be]" />
                  礼金{isReply ? "" : "（发给回复者）"}
                  <input
                    type="number"
                    min={0}
                    placeholder="金额"
                    value={giftMoney}
                    onChange={(e) => setGiftMoney(e.target.value)}
                    disabled={!asGift}
                    className="bmf-input !w-16 !py-0.5 !text-xs"
                  />
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={asBeg} onChange={(e) => setAsBeg(e.target.checked)} className="accent-[#3083be]" />
                  求赏
                </label>
              </div>
            </div>
          )}
          {msg && <div className="text-xs text-[#cc3311]">{msg}</div>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#999]">
              {isEdit ? "保存后返回主题" : "发布后自动跳转到新主题"}
            </span>
            <button type="button" onClick={submit} disabled={busy} className="bmf-btn bmf-btn-primary">
              {busy ? "提交中..." : isEdit ? "保存修改" : isReply ? "回复主题" : "发表主题"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
