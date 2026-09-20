-- BMF7 功能对齐迁移 #3（对照原版 install/db.sql）
-- 1) 主题简介（原版 threads.newdesc）
ALTER TABLE threads ADD COLUMN IF NOT EXISTS newdesc TEXT NOT NULL DEFAULT '';
-- 2) 出售内容买家列表（原版 posts.sellbuyer，逗号分隔 userid）
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sellbuyer TEXT NOT NULL DEFAULT '';
-- 3) 出售/红包/求赏流水（原版 beg 表，id = 帖子id + "1"/"2"/"3"）
CREATE TABLE IF NOT EXISTS beg (
  id VARCHAR(30) PRIMARY KEY,
  tid INT NOT NULL DEFAULT 0,
  beglog TEXT NOT NULL DEFAULT '',
  giftid TEXT NOT NULL DEFAULT '',
  begers INT NOT NULL DEFAULT 0,
  begmoneys INT NOT NULL DEFAULT 0
);
-- 4) 版块操作日志（原版 forumlog）
CREATE TABLE IF NOT EXISTS forumlog (
  id SERIAL PRIMARY KEY,
  fid INT NOT NULL DEFAULT 0,
  time INT NOT NULL DEFAULT 0,
  operator VARCHAR(60) NOT NULL DEFAULT '',
  action VARCHAR(100) NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT ''
);
-- 5) 禁止注册名单（原版 banname）
CREATE TABLE IF NOT EXISTS banname (
  name VARCHAR(60) PRIMARY KEY
);
