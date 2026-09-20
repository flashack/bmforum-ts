-- BMForum 复刻 · 第二期迁移（幂等）
-- 附件 / 敏感词 / IP封禁 / 邀请码 / 管理日志 / 站点配置 / 用户组权限位 / 点赞去重 / 通知已读

-- 用户组权限位
ALTER TABLE usergroup ADD COLUMN IF NOT EXISTS canview SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE usergroup ADD COLUMN IF NOT EXISTS canpost SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE usergroup ADD COLUMN IF NOT EXISTS canreply SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE usergroup ADD COLUMN IF NOT EXISTS canupload SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE usergroup ADD COLUMN IF NOT EXISTS canvote SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE usergroup ADD COLUMN IF NOT EXISTS canpm SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE usergroup ADD COLUMN IF NOT EXISTS candigg SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE usergroup ADD COLUMN IF NOT EXISTS cansearch SMALLINT NOT NULL DEFAULT 1;

-- 封禁用户组（id=4）
INSERT INTO usergroup (id, groupname, groupicon, showsort, canview, canpost, canreply, canupload, canvote, canpm, candigg, cansearch)
VALUES (4, '封禁用户', 'ban.gif', 4, 1, 0, 0, 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 游客：仅可浏览与搜索
UPDATE usergroup SET canpost = 0, canreply = 0, canupload = 0, canvote = 0, canpm = 0 WHERE id = 0;

-- 主题点赞去重名单
ALTER TABLE threads ADD COLUMN IF NOT EXISTS digguser TEXT NOT NULL DEFAULT '';

-- 通知已读
ALTER TABLE notification ADD COLUMN IF NOT EXISTS isread SMALLINT NOT NULL DEFAULT 0;

-- 附件（bytea 存储，保持纯 PostgreSQL 方案）
CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  tid INT NOT NULL DEFAULT 0,
  pid INT NOT NULL DEFAULT 0,
  filename TEXT NOT NULL DEFAULT '',
  mimetype TEXT NOT NULL DEFAULT 'application/octet-stream',
  size INT NOT NULL DEFAULT 0,
  uploader VARCHAR(24) NOT NULL DEFAULT '',
  uploadtime BIGINT NOT NULL DEFAULT 0,
  downloads INT NOT NULL DEFAULT 0,
  isavatar SMALLINT NOT NULL DEFAULT 0,
  data BYTEA NOT NULL
);

-- 敏感词过滤
CREATE TABLE IF NOT EXISTS wordfilter (
  id SERIAL PRIMARY KEY,
  find TEXT NOT NULL,
  replacewith TEXT NOT NULL DEFAULT '*'
);

-- IP 封禁（前缀匹配）
CREATE TABLE IF NOT EXISTS ipban (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  addtime BIGINT NOT NULL DEFAULT 0
);

-- 邀请码
CREATE TABLE IF NOT EXISTS invitecode (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  usedby VARCHAR(24) NOT NULL DEFAULT '',
  usedtime BIGINT NOT NULL DEFAULT 0,
  createtime BIGINT NOT NULL DEFAULT 0
);

-- 管理日志
CREATE TABLE IF NOT EXISTS adminlog (
  id SERIAL PRIMARY KEY,
  time BIGINT NOT NULL DEFAULT 0,
  operator VARCHAR(24) NOT NULL DEFAULT '',
  action VARCHAR(40) NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT ''
);

-- 站点配置
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
INSERT INTO config (key, value) VALUES ('invitereg', '0') ON CONFLICT (key) DO NOTHING;

-- 种子敏感词示例
INSERT INTO wordfilter (find, replacewith)
SELECT * FROM (VALUES ('垃圾广告', '**'), ('混蛋', '**')) AS v(find, replacewith)
WHERE NOT EXISTS (SELECT 1 FROM wordfilter);
