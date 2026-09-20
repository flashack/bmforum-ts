-- 好友/联系人补全（原版 contacts 表：friendlist.php）
-- type: 0=好友 1=特别关注 2=黑名单
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS type SMALLINT NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS contacts_owner_idx ON contacts (owner, contacts, type);
