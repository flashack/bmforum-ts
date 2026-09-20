import { query, queryOne } from "./db";

export interface ForumRow {
  id: number;
  type: string;
  bbsname: string;
  cdes: string;
  forum_cid: number;
  blad: string;
  showorder: number;
  topicnum: number;
  replysnum: number;
  fltitle: string;
  flposter: string;
  flposttime: number;
}

export interface SiteStats {
  threadnum: number;
  postsnum: number;
  regednum: number;
  todaynew: number;
  maxnews: number;
  lastposter: string;
  lastpostid: number;
  lastptime: number;
}

export interface TagRow {
  tagid: number;
  tagname: string;
  threads: number;
}

export async function getForumList(): Promise<ForumRow[]> {
  return query<ForumRow>(
    "SELECT id, type, bbsname, cdes, forum_cid, blad, showorder, topicnum, replysnum, fltitle, flposter, flposttime FROM forumdata ORDER BY showorder, id"
  );
}

export async function getForum(fid: number): Promise<ForumRow | null> {
  return queryOne<ForumRow>(
    "SELECT id, type, bbsname, cdes, forum_cid, blad, showorder, topicnum, replysnum, fltitle, flposter, flposttime FROM forumdata WHERE id = $1",
    [fid]
  );
}

export async function getSiteStats(): Promise<SiteStats> {
  const row = await queryOne<SiteStats>(
    "SELECT threadnum, postsnum, regednum, todaynew, maxnews, lastposter, lastpostid, lastptime FROM lastest WHERE id = 1"
  );
  return row ?? { threadnum: 0, postsnum: 0, regednum: 0, todaynew: 0, maxnews: 0, lastposter: "", lastpostid: 0, lastptime: 0 };
}

export async function getAnnounces() {
  return query<{ id: number; title: string; content: string; author: string; addtime: number; url: string }>(
    "SELECT id, title, content, author, addtime, url FROM announces ORDER BY addtime DESC LIMIT 8"
  );
}

export interface SiteConfig {
  bbstitle: string;
  bbstitle_en: string;
  footer: string;
  description: string;
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM bbs_config");
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    bbstitle: map.get("bbs_title") || "BMForum 论坛",
    bbstitle_en: map.get("short_title") || "BMForum",
    footer: map.get("footer_text") || "Powered by BMForum.com",
    description: map.get("bbs_des") || "",
  };
}

/** 热门标签云（原版按帖子数分级字号） */
export async function getHotTags(limit = 20): Promise<(TagRow & { size: number })[]> {
  const rows = await query<TagRow>(
    "SELECT tagid, tagname, threads FROM tags WHERE threads > 0 ORDER BY threads DESC LIMIT $1",
    [limit]
  );
  const max = Math.max(1, ...rows.map((r) => r.threads));
  const min = Math.min(...rows.map((r) => r.threads), max);
  return rows.map((r) => ({
    ...r,
    // 12 ~ 22px
    size: Math.round(12 + ((r.threads - min) / Math.max(1, max - min)) * 10),
  }));
}

/** 置顶 + 普通主题列表 */
export interface ThreadRow {
  tid: number;
  forumid: number;
  toptype: number;
  title: string;
  author: string;
  authorid: number;
  time: number;
  changetime: number;
  hits: number;
  replys: number;
  lastreply: string;
  islock: number;
  ttype: number;
  ttagname: string;
  ttagid: string;
}

export async function getThreads(
  forumid: number,
  limit: number,
  offset: number
): Promise<ThreadRow[]> {
  return query<ThreadRow>(
    `SELECT tid, forumid, toptype, title, author, authorid, time, changetime, hits, replys,
            lastreply, islock, ttype, ttagname, ttagid
     FROM threads
     WHERE forumid = $1 AND ttrash = 0
     ORDER BY toptype DESC, changetime DESC
     LIMIT $2 OFFSET $3`,
    [forumid, limit, offset]
  );
}

export async function countThreads(forumid: number): Promise<number> {
  const row = await queryOne<{ c: string }>(
    "SELECT count(*) AS c FROM threads WHERE forumid = $1 AND ttrash = 0",
    [forumid]
  );
  return parseInt(row?.c ?? "0", 10);
}

export async function getLatestThreads(limit = 10): Promise<ThreadRow[]> {
  return query<ThreadRow>(
    `SELECT tid, forumid, toptype, title, author, authorid, time, changetime, hits, replys,
            lastreply, islock, ttype, ttagname, ttagid
     FROM threads WHERE ttrash = 0
     ORDER BY changetime DESC LIMIT $1`,
    [limit]
  );
}

export interface BoardInfo {
  id: number;
  bbsname: string;
  forum_cid: number;
}

export async function getBoardMap(): Promise<Map<number, BoardInfo>> {
  const rows = await query<BoardInfo>("SELECT id, bbsname, forum_cid FROM forumdata WHERE type = 'forum'");
  return new Map(rows.map((r) => [r.id, r]));
}
