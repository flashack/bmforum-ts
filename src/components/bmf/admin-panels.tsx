"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

async function post(url: string, body: unknown): Promise<{ ok: boolean; error?: string; data?: Record<string, unknown> }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as { ok: boolean; error?: string };
}

/* ============ 版块/分类管理 ============ */
interface ForumRow {
  id: number;
  type: string;
  bbsname: string;
  cdes: string;
  blad: string;
  forum_cid: number;
  topicnum: number;
  replysnum: number;
}

export function ForumAdmin({ rows }: { rows: ForumRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editMods, setEditMods] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [mods, setMods] = useState("");
  const [parent, setParent] = useState<number | "">("");
  const [type, setType] = useState<"category" | "forum">("forum");

  const categories = rows.filter((r) => r.type === "category");
  const forums = rows.filter((r) => r.type === "forum");

  async function create() {
    setMsg("");
    const r = await post("/api/admin/forums", {
      action: "create",
      type,
      bbsname: name,
      cdes: desc,
      blad: mods,
      forum_cid: type === "forum" ? parent : 0,
    });
    if (!r.ok) return setMsg(r.error || "创建失败");
    setName("");
    setDesc("");
    setMods("");
    router.refresh();
  }

  async function saveEdit(id: number) {
    setMsg("");
    const r = await post("/api/admin/forums", { action: "edit", id, bbsname: editName, cdes: editDesc, blad: editMods });
    if (!r.ok) return setMsg(r.error || "保存失败");
    setEditing(null);
    router.refresh();
  }

  async function del(id: number, name: string) {
    if (!confirm(`确定删除「${name}」？`)) return;
    const r = await post("/api/admin/forums", { action: "delete", id });
    if (!r.ok) return setMsg(r.error || "删除失败");
    router.refresh();
  }

  return (
    <div className="bmf-row">
      {msg && <div className="mb-2 text-xs text-[#cc3311]">{msg}</div>}
      <div className="mb-4">
        {rows.map((r) => (
          <div key={r.id} className="border-b border-[#f0f0f0] py-1.5 text-[13px]">
            {editing === r.id ? (
              <div className="flex flex-wrap items-center gap-1">
                <input className="bmf-input !w-40" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <input className="bmf-input !w-52" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="描述" />
                <input className="bmf-input !w-32" value={editMods} onChange={(e) => setEditMods(e.target.value)} placeholder="版主,逗号分隔" />
                <button type="button" className="bmf-btn bmf-btn-primary !py-0.5 !text-xs" onClick={() => saveEdit(r.id)}>
                  保存
                </button>
                <button type="button" className="bmf-btn !py-0.5 !text-xs" onClick={() => setEditing(null)}>
                  取消
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span>
                  {r.type === "category" ? (
                    <b className="text-[#3083be]">[分类] {r.bbsname}</b>
                  ) : (
                    <>
                      <span className="text-[#999]">└ </span>
                      <b>{r.bbsname}</b>
                      <span className="ml-2 text-xs text-[#999]">
                        {r.topicnum} 主题 / {r.replysnum} 回复{r.blad ? ` · 版主：${r.blad}` : ""}
                      </span>
                    </>
                  )}
                </span>
                <span className="flex gap-2 text-xs">
                  <button
                    type="button"
                    className="text-[#3083be]"
                    onClick={() => {
                      setEditing(r.id);
                      setEditName(r.bbsname);
                      setEditDesc(r.cdes);
                      setEditMods(r.blad);
                    }}
                  >
                    编辑
                  </button>
                  <button type="button" className="text-[#cc3311]" onClick={() => del(r.id, r.bbsname)}>
                    删除
                  </button>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="rounded-sm border border-dashed border-[#cccccc] p-3">
        <div className="mb-2 text-xs font-bold text-[#666]">新增版块/分类</div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="bmf-input !w-28" value={type} onChange={(e) => setType(e.target.value as "category" | "forum")}>
            <option value="forum">版块</option>
            <option value="category">分类</option>
          </select>
          {type === "forum" && (
            <select className="bmf-input !w-36" value={parent} onChange={(e) => setParent(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">选择所属分类…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.bbsname}
                </option>
              ))}
            </select>
          )}
          <input className="bmf-input !w-44" value={name} onChange={(e) => setName(e.target.value)} placeholder="名称" />
          <input className="bmf-input !w-56" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="描述（选填）" />
          <input className="bmf-input !w-36" value={mods} onChange={(e) => setMods(e.target.value)} placeholder="版主（选填）" />
          <button type="button" className="bmf-btn bmf-btn-primary !py-1" onClick={create}>
            创建
          </button>
        </div>
        <div className="mt-1 text-[11px] text-[#999]">提示：删除前需清空版块内主题；分类需先清空其下版块。</div>
      </div>
    </div>
  );
}

/* ============ 公告管理 ============ */
interface AnnRow {
  id: number;
  title: string;
  author: string;
  addtime: number;
}

export function AnnounceAdmin({ rows }: { rows: AnnRow[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState("");

  async function create() {
    setMsg("");
    const r = await post("/api/admin/announce", { title, content });
    if (!r.ok) return setMsg(r.error || "发布失败");
    setTitle("");
    setContent("");
    router.refresh();
  }

  async function del(id: number) {
    if (!confirm("确定删除该公告？")) return;
    const r = await post("/api/admin/announce", { action: "delete", id });
    if (!r.ok) return setMsg(r.error || "删除失败");
    router.refresh();
  }

  return (
    <div className="bmf-row">
      {msg && <div className="mb-2 text-xs text-[#cc3311]">{msg}</div>}
      <div className="mb-3 grid gap-2">
        <input className="bmf-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="公告标题" />
        <textarea className="bmf-input" rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="公告内容" />
        <div className="text-right">
          <button type="button" className="bmf-btn bmf-btn-primary" onClick={create}>
            发布公告
          </button>
        </div>
      </div>
      {rows.map((a) => (
        <div key={a.id} className="flex items-center justify-between border-b border-[#f0f0f0] py-1.5 text-[13px]">
          <span>
            <b>{a.title}</b>
            <span className="ml-2 text-xs text-[#999]">
              {a.author} · {new Date(a.addtime * 1000).toLocaleDateString("zh-CN")}
            </span>
          </span>
          <button type="button" className="text-xs text-[#cc3311]" onClick={() => del(a.id)}>
            删除
          </button>
        </div>
      ))}
    </div>
  );
}

/* ============ 用户管理 ============ */
interface UserRow {
  userid: number;
  username: string;
  usergroup: number;
  postamount: number;
  regdate: string;
}

const GROUP_OPTIONS: [number, string][] = [
  [0, "游客"],
  [1, "注册会员"],
  [2, "版主"],
  [3, "管理员"],
  [4, "封禁用户"],
];

export function UsersAdmin({ rows }: { rows: UserRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [sig, setSig] = useState("");
  const [title2, setTitle2] = useState("");

  async function act(body: Record<string, unknown>, confirmText?: string) {
    setMsg("");
    if (confirmText && !confirm(confirmText)) return;
    const r = await post("/api/admin/users", body);
    if (!r.ok) return setMsg(r.error || "操作失败");
    router.refresh();
  }

  return (
    <div className="bmf-row">
      {msg && <div className="mb-2 text-xs text-[#cc3311]">{msg}</div>}
      {rows.map((u) => (
        <div key={u.userid} className="border-b border-[#f0f0f0] py-2 text-[13px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              <Link href={`/profile/${u.userid}`} className="font-bold text-[#3083be]">
                {u.username}
              </Link>
              <span className="ml-2 text-xs text-[#999]">
                {GROUP_OPTIONS.find((g) => g[0] === u.usergroup)?.[1] ?? u.usergroup} · {u.postamount} 帖 · 注册 {u.regdate?.slice(0, 10) || "—"}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-1 text-xs">
              <select
                className="bmf-input !w-24 !py-0.5"
                value={u.usergroup}
                onChange={(e) => act({ action: "setgroup", username: u.username, group: Number(e.target.value) })}
              >
                {GROUP_OPTIONS.map(([id, label]) => (
                  <option key={id} value={id} disabled={id === 3 && u.usergroup !== 3}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="text-[#3083be]"
                onClick={() => {
                  setEditing(editing === u.userid ? null : u.userid);
                  setSig("");
                  setTitle2("");
                }}
              >
                编辑资料
              </button>
              {u.usergroup === 4 ? (
                <button type="button" className="text-[#0a7d32]" onClick={() => act({ action: "unban", username: u.username })}>
                  解封
                </button>
              ) : (
                <button
                  type="button"
                  className="text-[#e0871c]"
                  onClick={() => act({ action: "ban", username: u.username }, `确定封禁「${u.username}」？`)}
                >
                  封禁
                </button>
              )}
              <button
                type="button"
                className="text-[#cc3311]"
                onClick={() => act({ action: "delete", username: u.username }, `确定删除用户「${u.username}」？其主题与回复将保留。`)}
              >
                删除
              </button>
            </span>
          </div>
          {editing === u.userid && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input className="bmf-input !w-40" value={title2} onChange={(e) => setTitle2(e.target.value)} placeholder="自定义头衔" />
              <input className="bmf-input !w-72" value={sig} onChange={(e) => setSig(e.target.value)} placeholder="新签名档（留空则只改头衔）" />
              <button
                type="button"
                className="bmf-btn !py-0.5 !text-xs"
                onClick={async () => {
                  const r = await post("/api/admin/users", {
                    action: "editsig",
                    username: u.username,
                    signtext: sig,
                    headtitle: title2,
                  });
                  if (!r.ok) return setMsg(r.error || "保存失败");
                  setEditing(null);
                  router.refresh();
                }}
              >
                保存资料
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============ 用户组权限 ============ */
interface GroupRow {
  id: number;
  groupname: string;
  canview: number;
  canpost: number;
  canreply: number;
  canupload: number;
  canvote: number;
  canpm: number;
  candigg: number;
  cansearch: number;
}

const PERM_LABELS: [keyof GroupRow, string][] = [
  ["canview", "浏览"],
  ["canpost", "发主题"],
  ["canreply", "回复"],
  ["canupload", "上传附件"],
  ["canvote", "投票"],
  ["canpm", "短消息"],
  ["candigg", "点赞"],
  ["cansearch", "搜索"],
];

export function GroupsAdmin({ rows }: { rows: GroupRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<Record<string, number>>(() => {
    const s: Record<string, number> = {};
    for (const g of rows) {
      for (const [key] of PERM_LABELS) s[`${g.id}:${String(key)}`] = Number(g[key]) || 0;
    }
    return s;
  });

  async function save(id: number) {
    setMsg("");
    const body: Record<string, unknown> = { id };
    for (const [key] of PERM_LABELS) body[String(key)] = state[`${id}:${String(key)}`] ? 1 : 0;
    const r = await post("/api/admin/groups", body);
    if (!r.ok) return setMsg(r.error || "保存失败");
    setMsg("权限已保存");
    router.refresh();
  }

  return (
    <div className="bmf-row overflow-x-auto">
      {msg && <div className="mb-2 text-xs text-[#336699]">{msg}</div>}
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left text-[#666]">
            <th className="py-1">用户组</th>
            {PERM_LABELS.map(([, label]) => (
              <th key={label} className="px-2 py-1 text-center">
                {label}
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.id} className="border-t border-[#f0f0f0]">
              <td className="py-1.5 font-bold">
                {g.groupname}
                <span className="ml-1 text-[#999]">(id {g.id})</span>
              </td>
              {PERM_LABELS.map(([key]) => (
                <td key={String(key)} className="px-2 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={!!state[`${g.id}:${String(key)}`]}
                    onChange={(e) => setState({ ...state, [`${g.id}:${String(key)}`]: e.target.checked ? 1 : 0 })}
                  />
                </td>
              ))}
              <td className="py-1.5 text-right">
                <button type="button" className="bmf-btn !py-0.5 !text-xs" onClick={() => save(g.id)}>
                  保存
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============ 回收站 ============ */
interface RecycleRow {
  tid: number;
  title: string;
  author: string;
  forumname: string | null;
  changetime: number;
}

export function RecycleAdmin({ rows }: { rows: RecycleRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function act(body: Record<string, unknown>, confirmText?: string) {
    setMsg("");
    if (confirmText && !confirm(confirmText)) return;
    const r = await post("/api/admin/recycle", body);
    if (!r.ok) return setMsg(r.error || "操作失败");
    router.refresh();
  }

  return (
    <div className="bmf-row">
      {msg && <div className="mb-2 text-xs text-[#cc3311]">{msg}</div>}
      {rows.length === 0 ? (
        <div className="text-xs text-[#999]">回收站为空。</div>
      ) : (
        <>
          {rows.map((t) => (
            <div key={t.tid} className="flex items-center justify-between border-b border-[#f0f0f0] py-1.5 text-[13px]">
              <span>
                <Link href={`/topic/${t.tid}`} className="text-[#3083be]">
                  {t.title}
                </Link>
                <span className="ml-2 text-xs text-[#999]">
                  {t.author} · 原版块：{t.forumname ?? "—"}
                </span>
              </span>
              <span className="flex gap-2 text-xs">
                <button type="button" className="text-[#0a7d32]" onClick={() => act({ action: "restore", tid: t.tid })}>
                  还原
                </button>
                <button type="button" className="text-[#cc3311]" onClick={() => act({ action: "purge", tid: t.tid }, "彻底删除后不可恢复，确定？")}>
                  彻底删除
                </button>
              </span>
            </div>
          ))}
          <div className="mt-3 text-right">
            <button
              type="button"
              className="bmf-btn bmf-btn-danger !text-xs"
              onClick={() => act({ action: "purgeall" }, "确定清空整个回收站？不可恢复！")}
            >
              清空回收站
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ============ 敏感词 ============ */
interface WordRow {
  id: number;
  find: string;
  replacewith: string;
}

export function WordsAdmin({ rows }: { rows: WordRow[] }) {
  const router = useRouter();
  const [find, setFind] = useState("");
  const [replacewith, setReplacewith] = useState("**");
  const [msg, setMsg] = useState("");

  async function add() {
    setMsg("");
    const r = await post("/api/admin/words", { action: "add", find, replacewith });
    if (!r.ok) return setMsg(r.error || "添加失败");
    setFind("");
    router.refresh();
  }

  async function del(id: number) {
    await post("/api/admin/words", { action: "delete", id });
    router.refresh();
  }

  return (
    <div className="bmf-row">
      {msg && <div className="mb-2 text-xs text-[#cc3311]">{msg}</div>}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input className="bmf-input !w-52" value={find} onChange={(e) => setFind(e.target.value)} placeholder="需要过滤的词语" />
        <input className="bmf-input !w-32" value={replacewith} onChange={(e) => setReplacewith(e.target.value)} placeholder="替换为" />
        <button type="button" className="bmf-btn bmf-btn-primary !py-1" onClick={add}>
          添加
        </button>
        <span className="text-[11px] text-[#999]">发帖/回帖/短消息标题与内容都会被实时过滤</span>
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-[#999]">暂无过滤规则。</div>
      ) : (
        rows.map((w) => (
          <div key={w.id} className="flex items-center justify-between border-b border-[#f0f0f0] py-1 text-[13px]">
            <span>
              <b className="text-[#cc3311]">{w.find}</b>
              <span className="mx-2 text-[#999]">→</span>
              {w.replacewith}
            </span>
            <button type="button" className="text-xs text-[#cc3311]" onClick={() => del(w.id)}>
              删除
            </button>
          </div>
        ))
      )}
    </div>
  );
}

/* ============ IP 封禁 ============ */
interface IpbanRow {
  id: number;
  ip: string;
  reason: string;
  addtime: number;
}

export function IpbanAdmin({ rows }: { rows: IpbanRow[] }) {
  const router = useRouter();
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");

  async function add() {
    setMsg("");
    const r = await post("/api/admin/ipban", { action: "add", ip, reason });
    if (!r.ok) return setMsg(r.error || "添加失败");
    setIp("");
    setReason("");
    router.refresh();
  }

  async function del(id: number) {
    await post("/api/admin/ipban", { action: "delete", id });
    router.refresh();
  }

  return (
    <div className="bmf-row">
      {msg && <div className="mb-2 text-xs text-[#cc3311]">{msg}</div>}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input className="bmf-input !w-52" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="IP 或前缀，如 192.168.1." />
        <input className="bmf-input !w-48" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="封禁原因（选填）" />
        <button type="button" className="bmf-btn bmf-btn-primary !py-1" onClick={add}>
          添加封禁
        </button>
        <span className="text-[11px] text-[#999]">前缀匹配：登录、注册、发帖时生效</span>
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-[#999]">暂无封禁记录。</div>
      ) : (
        rows.map((b) => (
          <div key={b.id} className="flex items-center justify-between border-b border-[#f0f0f0] py-1 text-[13px]">
            <span>
              <b>{b.ip}</b>
              {b.reason ? <span className="ml-2 text-xs text-[#999]">{b.reason}</span> : null}
            </span>
            <button type="button" className="text-xs text-[#0a7d32]" onClick={() => del(b.id)}>
              解封
            </button>
          </div>
        ))
      )}
    </div>
  );
}

/* ============ 邀请注册 ============ */
interface InviteRow {
  id: number;
  code: string;
  usedby: string;
  usedtime: number;
  createtime: number;
}

export function InviteAdmin({ rows, enabled }: { rows: InviteRow[]; enabled: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [codes, setCodes] = useState<string[]>([]);

  async function toggle() {
    const r = await post("/api/admin/invite", { action: "toggle" });
    if (!r.ok) return setMsg(r.error || "操作失败");
    router.refresh();
  }

  async function generate() {
    setMsg("");
    const r = await post("/api/admin/invite", { action: "generate", n: 10 });
    if (!r.ok) return setMsg(r.error || "生成失败");
    const data = r as unknown as { codes?: string[] };
    if (Array.isArray(data.codes)) setCodes(data.codes);
    router.refresh();
  }

  async function del(id: number) {
    await post("/api/admin/invite", { action: "delete", id });
    router.refresh();
  }

  return (
    <div className="bmf-row">
      {msg && <div className="mb-2 text-xs text-[#cc3311]">{msg}</div>}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px]">
        <span>
          邀请注册：<b className={enabled ? "text-[#0a7d32]" : "text-[#999]"}>{enabled ? "已开启" : "已关闭"}</b>
        </span>
        <button type="button" className="bmf-btn !py-0.5 !text-xs" onClick={toggle}>
          {enabled ? "关闭" : "开启"}
        </button>
        <button type="button" className="bmf-btn bmf-btn-primary !py-0.5 !text-xs" onClick={generate}>
          生成 10 个邀请码
        </button>
      </div>
      {codes.length > 0 && (
        <div className="mb-3 rounded-sm border border-[#bcd4e6] bg-[#eef4fa] p-2 font-mono text-xs">
          {codes.join("　")}
        </div>
      )}
      {rows.length === 0 ? (
        <div className="text-xs text-[#999]">还没有邀请码。</div>
      ) : (
        rows.map((c) => (
          <div key={c.id} className="flex items-center justify-between border-b border-[#f0f0f0] py-1 font-mono text-[12px]">
            <span>
              {c.code}
              {c.usedby ? (
                <span className="ml-2 font-sans text-xs text-[#0a7d32]">已被 {c.usedby} 使用</span>
              ) : (
                <span className="ml-2 font-sans text-xs text-[#999]">未使用</span>
              )}
            </span>
            {!c.usedby && (
              <button type="button" className="font-sans text-xs text-[#cc3311]" onClick={() => del(c.id)}>
                删除
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/* ============ 缓存重建 ============ */
export function RebuildButton() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setMsg("");
    setBusy(true);
    try {
      const r = await post("/api/admin/rebuild", {});
      setMsg(r.ok ? "统计缓存重建完成：版块计数、全站统计、标签计数已按数据库实际数据重算。" : r.error || "重建失败");
      if (r.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bmf-row">
      <p className="mb-2 text-[13px] text-[#666]">
        当统计数字出现偏差（如版块主题数、全站帖子数、标签计数）时，可一键按数据库实际数据重新计算。
      </p>
      <button type="button" className="bmf-btn bmf-btn-primary" onClick={run} disabled={busy}>
        {busy ? "重建中..." : "立即重建统计缓存"}
      </button>
      {msg && <div className="mt-2 text-xs text-[#0a7d32]">{msg}</div>}
    </div>
  );
}

/* ============ 站点设置（原版 setoptions） ============ */
export function OptionsAdmin({ values }: { values: Record<string, string> }) {
  const router = useRouter();
  const [bbsTitle, setBbsTitle] = useState(values.bbs_title ?? "");
  const [bbsDes, setBbsDes] = useState(values.bbs_des ?? "");
  const [welcome, setWelcome] = useState(values.welcomemess ?? "");
  const [closereg, setClosereg] = useState(values.closereg === "1");
  const [moneyunit, setMoneyunit] = useState(values.moneyunit ?? "金钱");
  const [perpage, setPerpage] = useState(values.perpage ?? "10");
  const [msg, setMsg] = useState("");

  async function save() {
    setMsg("");
    const r = await post("/api/admin/options", {
      bbs_title: bbsTitle,
      bbs_des: bbsDes,
      welcomemess: welcome,
      closereg: closereg ? "1" : "0",
      moneyunit,
      perpage,
    });
    if (!r.ok) return setMsg(r.error || "保存失败");
    setMsg("站点设置已保存。");
    router.refresh();
  }

  return (
    <div className="bmf-row grid max-w-xl gap-3">
      {msg && <div className="text-xs text-[#0a7d32]">{msg}</div>}
      <div>
        <label className="bmf-label">站点名称（导航栏与页面标题）</label>
        <input className="bmf-input" value={bbsTitle} onChange={(e) => setBbsTitle(e.target.value)} maxLength={40} />
      </div>
      <div>
        <label className="bmf-label">站点描述</label>
        <input className="bmf-input" value={bbsDes} onChange={(e) => setBbsDes(e.target.value)} maxLength={100} />
      </div>
      <div>
        <label className="bmf-label">导航栏欢迎语</label>
        <input
          className="bmf-input"
          value={welcome}
          onChange={(e) => setWelcome(e.target.value)}
          maxLength={80}
          placeholder="如：注册会员即可发帖交流，欢迎光临！"
        />
      </div>
      <div className="flex items-center gap-2">
        <input id="opt-closereg" type="checkbox" checked={closereg} onChange={(e) => setClosereg(e.target.checked)} />
        <label htmlFor="opt-closereg" className="text-[13px]">
          关闭注册（新用户暂时无法注册）
        </label>
      </div>
      <div>
        <label className="bmf-label">金钱单位名称（出售/礼金/求赏显示用）</label>
        <input className="bmf-input !w-40" value={moneyunit} onChange={(e) => setMoneyunit(e.target.value)} maxLength={10} />
      </div>
      <div>
        <label className="bmf-label">主题页每页回复数</label>
        <input
          className="bmf-input !w-24"
          value={perpage}
          onChange={(e) => setPerpage(e.target.value)}
          maxLength={3}
        />
      </div>
      <div>
        <button type="button" className="bmf-btn bmf-btn-primary" onClick={save}>
          保存设置
        </button>
      </div>
    </div>
  );
}

/* ============ 禁止注册名（原版 banname） ============ */
export function BannameAdmin({ rows }: { rows: string[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  async function add() {
    setMsg("");
    if (!name.trim()) return setMsg("请输入要禁止的名称");
    const r = await post("/api/admin/banname", { action: "add", name: name.trim() });
    if (!r.ok) return setMsg(r.error || "添加失败");
    setName("");
    router.refresh();
  }

  async function del(n: string) {
    await post("/api/admin/banname", { action: "delete", name: n });
    router.refresh();
  }

  return (
    <div className="bmf-row">
      {msg && <div className="mb-2 text-xs text-[#cc3311]">{msg}</div>}
      <div className="mb-3 flex items-center gap-2">
        <input
          className="bmf-input !w-52"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="禁止注册的用户名"
          maxLength={30}
        />
        <button type="button" className="bmf-btn bmf-btn-primary !py-1" onClick={add}>
          添加
        </button>
        <span className="text-[11px] text-[#999]">命中名单的用户名将无法注册</span>
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-[#999]">暂无禁止注册名。</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {rows.map((n) => (
            <span
              key={n}
              className="flex items-center gap-1 rounded-sm border border-[#dddddd] bg-[#f9f9f9] px-2 py-0.5 text-[12px]"
            >
              {n}
              <button type="button" className="text-[#cc3311]" onClick={() => del(n)}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ 附件管理（原版 attachment） ============ */
interface AttachRow {
  id: number;
  filename: string;
  size: number;
  downloads: number;
  username: string;
  tid: number;
}

export function AttachmentsAdmin({ rows }: { rows: AttachRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function del(id: number) {
    setMsg("");
    if (!confirm("确定删除该附件？帖子中的 [attach] 标记将无法显示。")) return;
    const r = await post("/api/admin/attachments", { action: "delete", id });
    if (!r.ok) return setMsg(r.error || "删除失败");
    router.refresh();
  }

  function fmtSize(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }

  return (
    <div className="bmf-row">
      {msg && <div className="mb-2 text-xs text-[#cc3311]">{msg}</div>}
      {rows.length === 0 ? (
        <div className="text-xs text-[#999]">暂无附件。</div>
      ) : (
        rows.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between border-b border-[#f0f0f0] py-1.5 text-[13px]"
          >
            <span className="min-w-0 flex-1 truncate">
              <a href={`/api/attachment/${a.id}`} className="text-[#3083be]" target="_blank" rel="noreferrer">
                {a.filename}
              </a>
              <span className="ml-2 text-xs text-[#999]">
                {fmtSize(a.size)} · 下载 {a.downloads} 次 · 上传者 {a.username}
              </span>
            </span>
            <span className="ml-3 flex flex-shrink-0 items-center gap-3 text-xs">
              {a.tid > 0 && (
                <Link href={`/topic/${a.tid}`} className="text-[#3083be]">
                  所属主题
                </Link>
              )}
              <button type="button" className="text-[#cc3311]" onClick={() => del(a.id)}>
                删除
              </button>
            </span>
          </div>
        ))
      )}
    </div>
  );
}
