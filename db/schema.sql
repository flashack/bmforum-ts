-- BMForum 复刻 数据库结构（PostgreSQL）
-- 忠实沿用原版表名与字段语义

-- 站点配置
CREATE TABLE IF NOT EXISTS bbs_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- 分类与版块（原 forumdata：type='category' 为分类）
CREATE TABLE IF NOT EXISTS forumdata (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'forum',
  bbsname TEXT NOT NULL DEFAULT '',
  cdes TEXT NOT NULL DEFAULT '',
  forum_cid INT NOT NULL DEFAULT 0,
  blad TEXT NOT NULL DEFAULT '',
  showorder INT NOT NULL DEFAULT 0,
  topicnum INT NOT NULL DEFAULT 0,
  replysnum INT NOT NULL DEFAULT 0,
  todayp INT NOT NULL DEFAULT 0,
  todaypt INT NOT NULL DEFAULT 0,
  fltitle TEXT NOT NULL DEFAULT '',
  flposter TEXT NOT NULL DEFAULT '',
  flposttime INT NOT NULL DEFAULT 0,
  guestpost TEXT NOT NULL DEFAULT '1'
);
CREATE INDEX IF NOT EXISTS idx_forumdata_cid ON forumdata (forum_cid);
CREATE INDEX IF NOT EXISTS idx_forumdata_order ON forumdata (showorder);

-- 用户组
CREATE TABLE IF NOT EXISTS usergroup (
  id INT PRIMARY KEY,
  groupname TEXT NOT NULL DEFAULT '',
  groupicon TEXT NOT NULL DEFAULT '',
  showsort INT NOT NULL DEFAULT 0
);

-- 用户（原 userlist）
CREATE TABLE IF NOT EXISTS userlist (
  userid SERIAL PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  pwd TEXT NOT NULL DEFAULT '',
  salt VARCHAR(16) NOT NULL DEFAULT '',
  mailadd TEXT NOT NULL DEFAULT '',
  usergroup INT NOT NULL DEFAULT 1,
  regdate TEXT NOT NULL DEFAULT '',
  signtext TEXT NOT NULL DEFAULT '',
  homepage TEXT NOT NULL DEFAULT '',
  fromwhere TEXT NOT NULL DEFAULT '',
  desper TEXT NOT NULL DEFAULT '',
  headtitle TEXT NOT NULL DEFAULT '',
  postamount INT NOT NULL DEFAULT 0,
  point INT NOT NULL DEFAULT 0,
  money INT NOT NULL DEFAULT 0,
  lastlogin INT NOT NULL DEFAULT 0,
  lastpost INT NOT NULL DEFAULT 0,
  avatar TEXT NOT NULL DEFAULT '',
  sex TEXT NOT NULL DEFAULT 'm',
  birthday TEXT NOT NULL DEFAULT '',
  online_status TEXT NOT NULL DEFAULT 'online'
);
CREATE INDEX IF NOT EXISTS idx_userlist_group ON userlist (usergroup);

-- 登录会话
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  userid INT NOT NULL,
  logintime INT NOT NULL DEFAULT 0,
  lastactive INT NOT NULL DEFAULT 0,
  ip TEXT NOT NULL DEFAULT ''
);

-- 主题（原 threads）
CREATE TABLE IF NOT EXISTS threads (
  tid SERIAL PRIMARY KEY,
  forumid INT NOT NULL DEFAULT 0,
  toptype SMALLINT NOT NULL DEFAULT 0,
  ttrash SMALLINT NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  authorid INT NOT NULL DEFAULT 0,
  time INT NOT NULL DEFAULT 0,
  changetime INT NOT NULL DEFAULT 0,
  hits INT NOT NULL DEFAULT 0,
  replys INT NOT NULL DEFAULT 0,
  lastreply TEXT NOT NULL DEFAULT '',
  islock SMALLINT NOT NULL DEFAULT 0,
  ttype SMALLINT NOT NULL DEFAULT 0,
  ttagname VARCHAR(200) NOT NULL DEFAULT '',
  ttagid VARCHAR(100) NOT NULL DEFAULT '',
  diggcount INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_threads_forum ON threads (forumid, toptype, ttrash, changetime);
CREATE INDEX IF NOT EXISTS idx_threads_change ON threads (changetime);
CREATE INDEX IF NOT EXISTS idx_threads_tagid ON threads (ttagid);

-- 回帖（原 posts）
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  tid INT NOT NULL,
  forumid INT NOT NULL DEFAULT 0,
  articletitle TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL DEFAULT '',
  usrid INT NOT NULL DEFAULT 0,
  articlecontent TEXT NOT NULL DEFAULT '',
  timestamp INT NOT NULL DEFAULT 0,
  changtime INT NOT NULL DEFAULT 0,
  posttrash SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_posts_tid ON posts (tid, id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts (usrid);

-- 标签（原 tags）
CREATE TABLE IF NOT EXISTS tags (
  tagid SERIAL PRIMARY KEY,
  tagname VARCHAR(100) NOT NULL UNIQUE,
  threads INT NOT NULL DEFAULT 0
);

-- 主题-标签关联
CREATE TABLE IF NOT EXISTS thread_tags (
  tid INT NOT NULL,
  tagid INT NOT NULL,
  PRIMARY KEY (tid, tagid)
);
CREATE INDEX IF NOT EXISTS idx_thread_tags_tag ON thread_tags (tagid);

-- 投票（原 polls）
CREATE TABLE IF NOT EXISTS polls (
  tid INT PRIMARY KEY,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  polluser JSONB NOT NULL DEFAULT '[]'::jsonb,
  maxchoose INT NOT NULL DEFAULT 1,
  deadline INT NOT NULL DEFAULT 0
);

-- 收藏（原 favorites）
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  tid INT NOT NULL,
  owner INT NOT NULL,
  addtime INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_fav_owner ON favorites (owner);

-- 短消息（原 primsg）
CREATE TABLE IF NOT EXISTS primsg (
  id SERIAL PRIMARY KEY,
  belong VARCHAR(60) NOT NULL DEFAULT '',
  sender VARCHAR(60) NOT NULL DEFAULT '',
  sendto VARCHAR(60) NOT NULL DEFAULT '',
  prtitle VARCHAR(200) NOT NULL DEFAULT '',
  prcontent TEXT NOT NULL DEFAULT '',
  prtime INT NOT NULL DEFAULT 0,
  prread SMALLINT NOT NULL DEFAULT 0,
  prtype CHAR(1) NOT NULL DEFAULT 'r'
);
CREATE INDEX IF NOT EXISTS idx_primsg_belong ON primsg (belong, prtime);
CREATE INDEX IF NOT EXISTS idx_primsg_sender ON primsg (sender, prtime);

-- 通知（原 notification）
CREATE TABLE IF NOT EXISTS notification (
  nid SERIAL PRIMARY KEY,
  senderid INT NOT NULL DEFAULT 0,
  sendername VARCHAR(60) NOT NULL DEFAULT '',
  receiverid INT NOT NULL DEFAULT 0,
  ntype VARCHAR(20) NOT NULL DEFAULT '',
  nvalue TEXT NOT NULL DEFAULT '',
  pkey INT NOT NULL DEFAULT 0,
  timestamp INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_notif_receiver ON notification (receiverid, timestamp);

-- 联系人（原 contacts）
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  owner INT NOT NULL,
  contacts INT NOT NULL,
  conname VARCHAR(60) NOT NULL DEFAULT '',
  adddate INT NOT NULL DEFAULT 0
);

-- 在线状态（原 onlinestat）
CREATE TABLE IF NOT EXISTS onlinestat (
  username TEXT NOT NULL DEFAULT '',
  onusrid INT NOT NULL DEFAULT 0,
  timestamp INT NOT NULL DEFAULT 0,
  ips TEXT NOT NULL DEFAULT '',
  filename TEXT NOT NULL DEFAULT '',
  ugnum INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_online_ts ON onlinestat (timestamp);

-- 全站统计（原 lastest）
CREATE TABLE IF NOT EXISTS lastest (
  id INT PRIMARY KEY DEFAULT 1,
  threadnum INT NOT NULL DEFAULT 0,
  postsnum INT NOT NULL DEFAULT 0,
  regednum INT NOT NULL DEFAULT 0,
  todaynew INT NOT NULL DEFAULT 0,
  lasttodaytime INT NOT NULL DEFAULT 0,
  maxnews INT NOT NULL DEFAULT 0,
  lastposter TEXT NOT NULL DEFAULT '',
  lastpostid INT NOT NULL DEFAULT 0,
  lastptime INT NOT NULL DEFAULT 0
);

-- 公告
CREATE TABLE IF NOT EXISTS announces (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  addtime INT NOT NULL DEFAULT 0,
  url TEXT NOT NULL DEFAULT ''
);

-- 日志（原 actlogs，管理操作记录）
CREATE TABLE IF NOT EXISTS actlogs (
  id SERIAL PRIMARY KEY,
  actdetail TEXT NOT NULL DEFAULT '',
  acter TEXT NOT NULL DEFAULT '',
  actreason TEXT NOT NULL DEFAULT '',
  acttime INT NOT NULL DEFAULT 0,
  forumid INT NOT NULL DEFAULT 0,
  actioncode TEXT NOT NULL DEFAULT ''
);

-- ===== 功能对齐迁移 #3（对照原版 install/db.sql）=====
-- 主题简介（原版 threads.newdesc）
ALTER TABLE threads ADD COLUMN IF NOT EXISTS newdesc TEXT NOT NULL DEFAULT '';
-- 出售内容买家列表（原版 posts.sellbuyer，逗号分隔 userid）
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sellbuyer TEXT NOT NULL DEFAULT '';
-- 出售/红包/求赏流水（原版 beg 表，id = 帖子id + "1"/"2"/"3"）
CREATE TABLE IF NOT EXISTS beg (
  id VARCHAR(30) PRIMARY KEY,
  tid INT NOT NULL DEFAULT 0,
  beglog TEXT NOT NULL DEFAULT '',
  giftid TEXT NOT NULL DEFAULT '',
  begers INT NOT NULL DEFAULT 0,
  begmoneys INT NOT NULL DEFAULT 0
);
-- 版块操作日志（原版 forumlog）
CREATE TABLE IF NOT EXISTS forumlog (
  id SERIAL PRIMARY KEY,
  fid INT NOT NULL DEFAULT 0,
  time INT NOT NULL DEFAULT 0,
  operator VARCHAR(60) NOT NULL DEFAULT '',
  action VARCHAR(100) NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT ''
);
-- 禁止注册名单（原版 banname）
CREATE TABLE IF NOT EXISTS banname (
  name VARCHAR(60) PRIMARY KEY
);
