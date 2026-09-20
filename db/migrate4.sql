-- BMF7 细节补齐：编辑标记 / 精华统计 / 投票细节
ALTER TABLE posts ADD COLUMN IF NOT EXISTS editinfo TEXT NOT NULL DEFAULT '';
ALTER TABLE userlist ADD COLUMN IF NOT EXISTS digestmount INT NOT NULL DEFAULT 0;
ALTER TABLE forumdata ADD COLUMN IF NOT EXISTS digestcount INT NOT NULL DEFAULT 0;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS viewafter SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS minposts INT NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ip TEXT NOT NULL DEFAULT '';
ALTER TABLE threads ADD COLUMN IF NOT EXISTS digest SMALLINT NOT NULL DEFAULT 0;
-- threads.type：主题类型（原版 1=投票主题）
ALTER TABLE threads ADD COLUMN IF NOT EXISTS type SMALLINT NOT NULL DEFAULT 0;
-- 历史数据迁移：原 islock=3（锁定+精华）拆分；原 toptype=2（精华）拆分为独立 digest 列
UPDATE threads SET islock = 1, digest = 1 WHERE islock = 3;
UPDATE threads SET digest = 1, toptype = 0 WHERE toptype = 2;
UPDATE threads SET type = 1 WHERE tid IN (SELECT DISTINCT tid FROM polls);
