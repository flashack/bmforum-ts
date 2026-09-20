-- BMForum 复刻 种子数据
TRUNCATE bbs_config, forumdata, usergroup, userlist, sessions, threads, posts, tags,
  thread_tags, polls, favorites, primsg, notification, contacts, onlinestat, lastest,
  announces, actlogs RESTART IDENTITY;

-- 配置
INSERT INTO bbs_config (key, value) VALUES
  ('bbs_title', 'BMForum 论坛'),
  ('short_title', 'BMForum'),
  ('bbs_des', '复刻自 BMForum 7 · 新版主题 BSD12 风格'),
  ('footer_text', 'Powered by BMForum.com · 本页面为 TypeScript + PostgreSQL 复刻版');

-- 用户组
INSERT INTO usergroup (id, groupname, groupicon, showsort) VALUES
  (0, '游客', 'guest.gif', 0),
  (1, '注册会员', 'member.gif', 1),
  (2, '版主', 'moderator.gif', 2),
  (3, '管理员', 'administrator.gif', 3);

-- 用户（pwd 均为 password123，由脚本重算 scrypt）
INSERT INTO userlist (userid, username, pwd, salt, mailadd, usergroup, regdate, signtext, fromwhere, desper, headtitle, postamount, point, money, avatar, sex, birthday) VALUES
  (1, 'admin', '', '', 'admin@bmforum.dev', 3, '2005-08-01', '论坛的管理员，有问题请找我。', '管理后台', '负责论坛日常维护与安全管理。', '管理员', 128, 9999, 50000, '', 'm', '1980-01-01'),
  (2, 'bsd_fan', '', '', 'fan@bmforum.dev', 2, '2007-03-15', 'BSD12 是永恒的经典主题。', '上海', '老论坛程序爱好者，收集各种经典皮肤。', '技术区版主', 86, 3200, 12000, '', 'm', '1985-06-20'),
  (3, '月光骑士', '', '', 'moon@bmforum.dev', 1, '2010-11-02', '潜水多年，偶尔冒泡。', '广州', '普通坛友一枚。', '', 45, 1500, 5600, '', 'f', '1990-09-12'),
  (4, 'php老兵', '', '', 'vet@bmforum.dev', 1, '2008-06-30', 'PHP 是世界上最好的语言（狗头）', '北京', '写了十年 PHP 的老码农。', '', 67, 2300, 8800, '', 'm', '1983-04-18'),
  (5, '水贴之王', '', '', 'water@bmforum.dev', 1, '2015-02-14', '灌水使我快乐。', '成都', '专业灌水二十年。', '', 210, 800, 3200, '', 'm', '1995-12-05');

-- 分类
INSERT INTO forumdata (id, type, bbsname, cdes, showorder) VALUES
  (1, 'category', '站务管理', '论坛公告与管理事务', 1),
  (2, 'category', '技术交流', '程序开发与设计技术', 2),
  (3, 'category', '休闲娱乐', '灌水与闲聊', 3);

-- 版块
INSERT INTO forumdata (id, type, bbsname, cdes, forum_cid, blad, showorder, guestpost) VALUES
  (10, 'forum', '公告与规则', '论坛最新公告、制度与须知，发帖前必读', 1, 'admin', 1, '0'),
  (11, 'forum', '意见反馈', '对论坛的建议与意见反馈专区', 1, 'admin,bsd_fan', 2, '0'),
  (20, 'forum', 'PHP / 后端开发', 'PHP、Node.js 等后端技术讨论', 2, 'bsd_fan,php老兵', 1, '1'),
  (21, 'forum', '前端与设计', 'HTML/CSS/JS、界面设计与用户体验', 2, 'bsd_fan', 2, '1'),
  (22, 'forum', '数据库专区', 'MySQL、PostgreSQL 等数据库技术', 2, 'php老兵', 3, '1'),
  (30, 'forum', '灌水乐园', '轻松一刻，畅所欲言', 3, '水贴之王', 1, '1'),
  (31, 'forum', '经典怀旧', '追忆老论坛、老软件与互联网记忆', 3, '月光骑士', 2, '1');

-- 标签
INSERT INTO tags (tagid, tagname, threads) VALUES
  (1, 'BMForum', 3),
  (2, '经典论坛', 2),
  (3, 'PHP', 2),
  (4, 'PostgreSQL', 2),
  (5, '前端', 1),
  (6, '怀旧', 2),
  (7, '灌水', 2),
  (8, '公告', 1);

-- 公告
INSERT INTO announces (title, content, author, addtime, url) VALUES
  ('欢迎来到 BMForum 复刻版', '本站是 BMForum 7 论坛系统的 TypeScript + PostgreSQL 复刻版，保留了经典的 BSD12 主题风格。注册后即可发帖、回帖、投票、发短消息。', 'admin', 1700000000, ''),
  ('发帖规范提醒', '请勿发布违规内容，尊重他人，维护论坛氛围。BMBCode 语法（[b][i][u][quote][img][url][color]）已支持。', 'admin', 1700100000, ''),
  ('标签功能上线', '发帖时可添加标签（Tags），让帖子联系更紧密，这是 BMForum 的招牌功能！', 'admin', 1700200000, '/tags');

-- 主题
INSERT INTO threads (tid, forumid, toptype, ttrash, title, content, author, authorid, time, changetime, hits, replys, lastreply, islock, ttype, ttagname, ttagid, diggcount) VALUES
  (1, 10, 2, 0, '[公告] BMForum 复刻版正式上线', '经过努力，BMForum 7 的 TypeScript + PostgreSQL 复刻版正式上线！[b]功能包括：[/b][list]分类版块、主题回帖、BMBCode、标签、投票、短消息、在线列表、后台管理[/list]欢迎体验。', 'admin', 1, 1700000000, 1700990000, 356, 4, '月光骑士', 0, 0, 'BMForum,公告', '1,8', 12),
  (2, 10, 1, 0, '[公告] 论坛发帖规范 v2', '为维护论坛秩序，请遵守以下规范：[quote]1. 禁止灌水广告；2. 标题明确；3. 尊重他人[/quote]违规将被扣分处理。', 'admin', 1, 1699000000, 1699000000, 220, 1, '水贴之王', 0, 0, '公告', '8', 5),
  (3, 20, 0, 0, '从 PHP 迁移到 TypeScript 的心得', '十年 PHP 老兵表示：[b]TypeScript 的类型系统真的香[/b]。用 node-postgres 原生驱动连接 PG，配合 Next.js 服务端组件，开发体验拉满。附上连接池代码：[code]import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { rows } = await pool.query("SELECT * FROM threads LIMIT 10");[/code]', 'php老兵', 4, 1700500000, 1700900000, 189, 3, 'bsd_fan', 0, 0, 'PHP,PostgreSQL', '3,4', 8),
  (4, 22, 0, 0, 'PostgreSQL 17 有哪些值得升级的新特性', 'PG 17 的 VACUUM 性能提升、MERGE 增强都很实用。大家的生产环境都升级了吗？', 'php老兵', 4, 1700600000, 1700850000, 143, 2, 'admin', 0, 0, 'PostgreSQL', '4', 6),
  (5, 21, 0, 0, '用现代 CSS 复刻 Bootstrap 2 时代界面', '渐变按钮、圆角输入框、table 布局……复刻老论坛界面比想象中有趣。核心是把 .announcement 蓝条还原出来。', 'bsd_fan', 2, 1700700000, 1700800000, 98, 1, '月光骑士', 0, 0, '前端,怀旧', '5,6', 4),
  (6, 30, 0, 0, '[投票] 你最早用的论坛程序是哪个？', '来投个票，看看大家都是从什么年代过来的！', '水贴之王', 5, 1700750000, 1700880000, 310, 2, '月光骑士', 0, 1, '灌水,怀旧', '7,6', 15),
  (7, 31, 0, 0, '晒出你的老论坛收藏：BMForum、Discuz、PHPWind', '那些年的三大 PHP 论坛程序，谁还记得「主题随意贴」这个功能？', '月光骑士', 3, 1700800000, 1700860000, 176, 1, 'php老兵', 0, 0, '怀旧,BMForum,经典论坛', '6,1,2', 9),
  (8, 30, 0, 0, '今天天气不错，出来冒个泡', '水一水，涨积分。', '水贴之王', 5, 1700900000, 1700910000, 88, 0, '', 0, 0, '灌水', '7', 1),
  (9, 20, 0, 0, 'Node.js 里怎么优雅地写数据库迁移脚本', '用纯 SQL 文件 + 启动脚本执行，比 ORM 迁移更直观，大家怎么看？', '月光骑士', 3, 1700850000, 1700890000, 65, 0, '', 0, 0, 'PostgreSQL,PHP', '4,3', 2),
  (10, 11, 0, 0, '建议增加夜间模式', '如题，晚上看论坛太亮了。', '月光骑士', 3, 1700650000, 1700660000, 45, 1, 'admin', 0, 0, '经典论坛', '2', 3);

-- 回帖
INSERT INTO posts (tid, forumid, articletitle, username, usrid, articlecontent, timestamp, changtime) VALUES
  (1, 10, '', 'bsd_fan', 2, '恭喜恭喜！BSD12 主题还原度很高，梦回 2010。', 1700010000, 0),
  (1, 10, '', '月光骑士', 3, '签名档功能什么时候上？', 1700020000, 0),
  (1, 10, 'RE: 上线公告', '水贴之王', 5, '前排围观，灌水乐园走起！', 1700030000, 0),
  (1, 10, '', 'php老兵', 4, 'BMBCode 解析器写得很扎实，[url=https://www.bmforum.com]原版官网[/url]的精神续作。', 1700990000, 0),
  (2, 10, '', '水贴之王', 5, '收到，一定遵守规范。', 1699010000, 0),
  (3, 20, 'RE: 迁移心得', 'bsd_fan', 2, '同感。原生 SQL + 参数化查询在服务端组件里直接 await，太爽了。', 1700910000, 0),
  (3, 20, '', '月光骑士', 3, '请问连接池需要单例吗？', 1700920000, 0),
  (3, 20, '', 'php老兵', 4, '需要的，全局 Pool 复用即可，参考我的帖子里的写法。', 1700900000, 0),
  (4, 22, 'RE: PG 17', 'admin', 1, '我们论坛就是 PG 17 跑的，稳。', 1700851000, 0),
  (4, 22, '', '月光骑士', 3, '还在 16，观察一波再说。', 1700852000, 0),
  (5, 21, '', '月光骑士', 3, '蓝条 #3083BE 一出来，DNA 动了。', 1700801000, 0),
  (6, 30, '', 'php老兵', 4, 'Discuz！当年大学 BBS 全靠它。', 1700881000, 0),
  (6, 30, '', '月光骑士', 3, 'PHPWind 也有，界面很清新。', 1700882000, 0),
  (7, 31, '', 'php老兵', 4, 'BMForum 的标签功能当年是国内首创，超前了。', 1700861000, 0),
  (10, 11, '', 'admin', 1, '收到建议，已列入计划，感谢反馈。', 1700661000, 0);

-- 投票（tid=6）
INSERT INTO polls (tid, options, polluser, maxchoose, deadline) VALUES
  (6, '[{"text":"Discuz!","votes":2},{"text":"PHPWind","votes":1},{"text":"BMForum","votes":3},{"text":"phpBB","votes":0},{"text":"动网论坛","votes":1}]'::jsonb, '[1,2,3,4,5,2,3]'::jsonb, 2, 1800000000);

-- 主题-标签关联
INSERT INTO thread_tags (tid, tagid) VALUES
  (1,1),(1,8),(2,8),(3,3),(3,4),(4,4),(5,5),(5,6),(6,7),(6,6),(7,6),(7,1),(7,2),(8,7),(9,4),(9,3),(10,2);

-- 收藏示例
INSERT INTO favorites (tid, owner, addtime) VALUES (3, 3, 1700800000), (6, 3, 1700800000);

-- 短消息示例
INSERT INTO primsg (belong, sender, sendto, prtitle, prcontent, prtime, prread, prtype) VALUES
  ('月光骑士', 'admin', '月光骑士', '欢迎加入 BMForum', '欢迎注册本论坛，有问题随时反馈！', 1700100000, 1, 'r'),
  ('admin', '月光骑士', 'admin', 'RE: 欢迎加入', '谢谢管理员！', 1700150000, 1, 'r'),
  ('月光骑士', 'bsd_fan', '月光骑士', '一起搞复古皮肤吗', '看到你在怀旧区的帖子，有兴趣一起复刻 bsd07 吗？', 1700200000, 0, 'r');

-- 通知示例
INSERT INTO notification (senderid, sendername, receiverid, ntype, nvalue, pkey, timestamp) VALUES
  (2, 'bsd_fan', 3, 'reply', '回复了你的主题「Node.js 里怎么优雅地写数据库迁移脚本」', 9, 1700890000),
  (4, 'php老兵', 2, 'digg', '觉得你的帖子很赞', 3, 1700910000);

-- 统计
INSERT INTO lastest (id, threadnum, postsnum, regednum, todaynew, lasttodaytime, maxnews, lastposter, lastpostid, lastptime)
VALUES (1, 10, 25, 5, 3, 1700990000, 47, 'php老兵', 4, 1700990000);
