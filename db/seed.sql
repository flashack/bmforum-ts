-- BMForum 7 复刻 · 种子数据（由 scripts/dump-seed.mjs 导出）
-- 恢复方式：psql -f db/seed.sql 或由 scripts/prod-db.mjs 在空库时自动灌入
BEGIN;

INSERT INTO public."adminlog" ("id", "time", "operator", "action", "detail") VALUES (1, 1789911925, 'admin', 'addword', '新增敏感词 回归敏感词XYZ');
INSERT INTO public."adminlog" ("id", "time", "operator", "action", "detail") VALUES (2, 1789911925, 'admin', 'ipban', '封禁 IP 前缀 10.99.99.99');
INSERT INTO public."adminlog" ("id", "time", "operator", "action", "detail") VALUES (3, 1789911925, 'admin', 'purgeall', '清空回收站');
INSERT INTO public."adminlog" ("id", "time", "operator", "action", "detail") VALUES (4, 1789911925, 'admin', 'invitegen', '生成 2 个邀请码');
INSERT INTO public."adminlog" ("id", "time", "operator", "action", "detail") VALUES (5, 1789911925, 'admin', 'setperms', '调整用户组 1 权限');
INSERT INTO public."adminlog" ("id", "time", "operator", "action", "detail") VALUES (6, 1789911925, 'admin', 'edituser', '编辑用户 bsd_fan 的签名/头衔');
INSERT INTO public."adminlog" ("id", "time", "operator", "action", "detail") VALUES (7, 1789911929, 'admin', 'rebuild', '重建统计缓存');

INSERT INTO public."announces" ("id", "title", "content", "author", "addtime", "url") VALUES (1, '欢迎来到 BMForum 复刻版', '本站是 BMForum 7 论坛系统的 TypeScript + PostgreSQL 复刻版，保留了经典的 BSD12 主题风格。注册后即可发帖、回帖、投票、发短消息。', 'admin', 1700000000, '');
INSERT INTO public."announces" ("id", "title", "content", "author", "addtime", "url") VALUES (2, '发帖规范提醒', '请勿发布违规内容，尊重他人，维护论坛氛围。BMBCode 语法（[b][i][u][quote][img][url][color]）已支持。', 'admin', 1700100000, '');
INSERT INTO public."announces" ("id", "title", "content", "author", "addtime", "url") VALUES (3, '标签功能上线', '发帖时可添加标签（Tags），让帖子联系更紧密，这是 BMForum 的招牌功能！', 'admin', 1700200000, '/tags');

INSERT INTO public."attachments" ("id", "tid", "pid", "filename", "mimetype", "size", "uploader", "uploadtime", "downloads", "isavatar", "data") VALUES (3, 0, 0, 'av3.png', 'image/png', 70, 'bsd_fan', 1789912623, 0, 1, decode('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da636460f85f0f0002870180eb47ba920000000049454e44ae426082','hex'));

INSERT INTO public."bbs_config" ("key", "value") VALUES ('short_title', 'BMForum');
INSERT INTO public."bbs_config" ("key", "value") VALUES ('footer_text', 'Powered by BMForum.com · 本页面为 TypeScript + PostgreSQL 复刻版');
INSERT INTO public."bbs_config" ("key", "value") VALUES ('bbs_title', 'BMForum 论坛');
INSERT INTO public."bbs_config" ("key", "value") VALUES ('bbs_des', '复刻自 BMForum 7 · 新版主题 BSD12 风格');

INSERT INTO public."config" ("key", "value") VALUES ('invitereg', '0');

INSERT INTO public."forumdata" ("id", "type", "bbsname", "cdes", "forum_cid", "blad", "showorder", "topicnum", "replysnum", "todayp", "todaypt", "fltitle", "flposter", "flposttime", "guestpost", "digestcount") VALUES (20, 'forum', 'PHP / 后端开发', 'PHP、Node.js 等后端技术讨论', 2, 'bsd_fan,php老兵', 1, 2, 1, 0, 0, '从 PHP 迁移到 TypeScript 的心得', 'php老兵', 1700900000, '1', 0);
INSERT INTO public."forumdata" ("id", "type", "bbsname", "cdes", "forum_cid", "blad", "showorder", "topicnum", "replysnum", "todayp", "todaypt", "fltitle", "flposter", "flposttime", "guestpost", "digestcount") VALUES (31, 'forum', '经典怀旧', '追忆老论坛、老软件与互联网记忆', 3, '月光骑士', 2, 1, 0, 0, 0, '晒出你的老论坛收藏：BMForum、Discuz、PHPWind', '月光骑士', 1700860000, '1', 0);
INSERT INTO public."forumdata" ("id", "type", "bbsname", "cdes", "forum_cid", "blad", "showorder", "topicnum", "replysnum", "todayp", "todaypt", "fltitle", "flposter", "flposttime", "guestpost", "digestcount") VALUES (11, 'forum', '意见反馈', '对论坛的建议与意见反馈专区', 1, 'admin,bsd_fan', 2, 2, 0, 1, 0, '建议增加夜间模式', '月光骑士', 1700660000, '0', 0);
INSERT INTO public."forumdata" ("id", "type", "bbsname", "cdes", "forum_cid", "blad", "showorder", "topicnum", "replysnum", "todayp", "todaypt", "fltitle", "flposter", "flposttime", "guestpost", "digestcount") VALUES (1, 'category', '站务管理', '论坛公告与管理事务', 0, '', 1, 0, 0, 0, 0, '', '', 0, '1', 0);
INSERT INTO public."forumdata" ("id", "type", "bbsname", "cdes", "forum_cid", "blad", "showorder", "topicnum", "replysnum", "todayp", "todaypt", "fltitle", "flposter", "flposttime", "guestpost", "digestcount") VALUES (2, 'category', '技术交流', '程序开发与设计技术', 0, '', 2, 0, 0, 0, 0, '', '', 0, '1', 0);
INSERT INTO public."forumdata" ("id", "type", "bbsname", "cdes", "forum_cid", "blad", "showorder", "topicnum", "replysnum", "todayp", "todaypt", "fltitle", "flposter", "flposttime", "guestpost", "digestcount") VALUES (3, 'category', '休闲娱乐', '灌水与闲聊', 0, '', 3, 0, 0, 0, 0, '', '', 0, '1', 0);
INSERT INTO public."forumdata" ("id", "type", "bbsname", "cdes", "forum_cid", "blad", "showorder", "topicnum", "replysnum", "todayp", "todaypt", "fltitle", "flposter", "flposttime", "guestpost", "digestcount") VALUES (33, 'forum', 'Linux & Shell', '命令行与脚本玩家的角落', 20, 'admin', 23, 0, 0, 0, 0, '', '', 0, '1', 0);
INSERT INTO public."forumdata" ("id", "type", "bbsname", "cdes", "forum_cid", "blad", "showorder", "topicnum", "replysnum", "todayp", "todaypt", "fltitle", "flposter", "flposttime", "guestpost", "digestcount") VALUES (10, 'forum', '公告与规则', '论坛最新公告、制度与须知，发帖前必读', 1, 'admin', 1, 2, 3, 1, 0, '[公告] BMForum 复刻版正式上线', 'admin', 1700990000, '0', 0);
INSERT INTO public."forumdata" ("id", "type", "bbsname", "cdes", "forum_cid", "blad", "showorder", "topicnum", "replysnum", "todayp", "todaypt", "fltitle", "flposter", "flposttime", "guestpost", "digestcount") VALUES (21, 'forum', '前端与设计', 'HTML/CSS/JS、界面设计与用户体验', 2, 'bsd_fan', 2, 1, 0, 0, 0, '用现代 CSS 复刻 Bootstrap 2 时代界面', 'bsd_fan', 1700800000, '1', 0);
INSERT INTO public."forumdata" ("id", "type", "bbsname", "cdes", "forum_cid", "blad", "showorder", "topicnum", "replysnum", "todayp", "todaypt", "fltitle", "flposter", "flposttime", "guestpost", "digestcount") VALUES (22, 'forum', '数据库专区', 'MySQL、PostgreSQL 等数据库技术', 2, 'php老兵', 3, 1, 1, 3, 0, 'PostgreSQL 17 有哪些值得升级的新特性', 'php老兵', 1700850000, '1', 0);
INSERT INTO public."forumdata" ("id", "type", "bbsname", "cdes", "forum_cid", "blad", "showorder", "topicnum", "replysnum", "todayp", "todaypt", "fltitle", "flposter", "flposttime", "guestpost", "digestcount") VALUES (30, 'forum', '灌水乐园', '轻松一刻，畅所欲言', 3, '水贴之王', 1, 3, 1, 5, 0, '交易标签功能演示（出售/礼金/求赏）', 'admin', 1789953781, '1', 0);

INSERT INTO public."forumlog" ("id", "fid", "time", "operator", "action", "detail") VALUES (7, 30, 1789921357, '月光骑士', '编辑帖子', '细节冒烟·投票主题（#24）');
INSERT INTO public."forumlog" ("id", "fid", "time", "operator", "action", "detail") VALUES (8, 30, 1789921630, 'bsd_fan', '编辑帖子', '交易标签功能演示（出售/礼金/求赏）（#22）');
INSERT INTO public."forumlog" ("id", "fid", "time", "operator", "action", "detail") VALUES (9, 30, 1789921836, 'admin', '删帖', '帖子 #30');

INSERT INTO public."invitecode" ("id", "code", "usedby", "usedtime", "createtime") VALUES (4, 'BMF-B592A69C17', '', 0, 1789912128);
INSERT INTO public."invitecode" ("id", "code", "usedby", "usedtime", "createtime") VALUES (3, 'BMF-99E5962686', 'inv_reg_ok', 1789912128, 1789912128);

INSERT INTO public."ipban" ("id", "ip", "reason", "addtime") VALUES (2, '10.99.99.', '回归测试', 1789912128);

INSERT INTO public."lastest" ("id", "threadnum", "postsnum", "regednum", "todaynew", "lasttodaytime", "maxnews", "lastposter", "lastpostid", "lastptime") VALUES (1, 12, 29, 5, 5, 1700990000, 47, 'admin', 1, 1700990000);

INSERT INTO public."notification" ("nid", "senderid", "sendername", "receiverid", "ntype", "nvalue", "pkey", "timestamp", "isread") VALUES (1, 2, 'bsd_fan', 3, 'reply', '回复了你的主题「Node.js 里怎么优雅地写数据库迁移脚本」', 9, 1700890000, 0);
INSERT INTO public."notification" ("nid", "senderid", "sendername", "receiverid", "ntype", "nvalue", "pkey", "timestamp", "isread") VALUES (2, 4, 'php老兵', 2, 'digg', '觉得你的帖子很赞', 3, 1700910000, 0);

INSERT INTO public."polls" ("tid", "options", "polluser", "maxchoose", "deadline", "viewafter", "minposts") VALUES (6, '[{"text":"Discuz!","votes":2},{"text":"PHPWind","votes":1},{"text":"BMForum","votes":3},{"text":"phpBB","votes":0},{"text":"动网论坛","votes":1}]'::jsonb, '[1,2,3,4,5,2,3]'::jsonb, 2, 1800000000, 0, 0);

INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (3, 1, 10, '', '月光骑士', 3, '签名档功能什么时候上？', 1700020000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (4, 1, 10, 'RE: 上线公告', '水贴之王', 5, '前排围观，灌水乐园走起！', 1700030000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (22, 8, 30, '今天天气不错，出来冒个泡', '水贴之王', 5, '如题，今天天气真心不错，阳光明媚，适合出来冒个泡~ [s:1]

大家那边天气怎么样？最近水区有点冷清啊，都出来聊聊。
顺便晒晒今天的随手拍：[img]https://dummyimage.com/480x300/89c4f4/ffffff.png&text=sunny+day[/img]

[s:b]水区日常，勿升精华[/s:b]', 1700900000, 0, 0, '', '', '192.168.1.66');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (23, 9, 20, 'Node.js 里怎么优雅地写数据库迁移脚本', '月光骑士', 3, '最近在把论坛从 PHP 迁到 TypeScript，聊一下数据库迁移脚本的写法心得。

[b]方案一：SQL 文件 + 启动时按序执行[/b]
把 DDL/种子放在 db/schema.sql 和 db/migrate*.sql，启动时检查版本号，按序执行。简单可靠，推荐中小项目。

[b]方案二：migration 框架[/b]
比如 node-pg-migrate / knex，提供 up/down 回滚。团队大了之后有用，但引入依赖较重。

[list][*]迁移必须幂等（IF NOT EXISTS）[*]种子数据与结构分开导出[*]大表加索引记得 CONCURRENTLY[/list]

大家用什么方案？欢迎交流。', 1700850000, 0, 0, '', '', '192.168.1.33');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (11, 3, 20, '', '月光骑士', 3, '请问连接池需要单例吗？', 1700920000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (27, 15, 30, '交易标签功能演示（出售/礼金/求赏）', 'bsd_fan', 2, '出售与求赏演示。

[sell=20]这段是付费内容：购买后才能看到（演示用，作者可在帖子下方退款）。[/sell]

[beg]觉得有用的话，欢迎打赏楼主～[/beg]', 1789919412, 1789919412, 0, '', '', '127.0.0.1');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (1, 1, 10, '[公告] BMForum 复刻版正式上线', 'bsd_fan', 2, '经过一段时间的努力，BMForum 7 复刻版今天正式上线了！

[b]本次复刻完整还原的功能：[/b]
[list]
[*]经典 BSD12「新版主题」界面，蓝条 #3083BE、970px 居中布局
[*]完整的 BMBCode 标签：加粗/颜色/引用/代码/图片/表情，以及出售 [pay]、礼金 [gift]、求赏 [beg]
[*]投票系统：单选/多选、投票后查看结果、到期截止、最低发帖数
[*]短消息、收藏、举报、验证码、后台管理一应俱全
[/list]

感谢各位老玩家的支持，梦回 2010！发现问题请到建站交流版块反馈。', 1700000000, 0, 0, '', '', '192.168.1.10');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (2, 1, 10, '', 'bsd_fan', 2, '恭喜恭喜！BSD12 主题还原度很高，梦回 2010。', 1700010000, 1700010000, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (5, 1, 10, '', 'php老兵', 4, 'BMBCode 解析器写得很扎实，[url=https://www.bmforum.com]原版官网[/url]的精神续作。', 1700990000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (6, 2, 10, '[公告] 论坛发帖规范 v2', '水贴之王', 5, '为维护社区氛围，论坛发帖规范 v2 发布如下：

[b]1.[/b] 标题请描述清楚问题，拒绝「求救」「高手进」
[b]2.[/b] 技术问题请到对应版块发帖，勿跨区
[b]3.[/b] 禁止发布广告、灌水机行为，违者封禁
[b]4.[/b] 转载内容请注明出处

[color=red]请各位自觉遵守，多次违规将禁言处理。[/color]', 1699000000, 0, 0, '', '', '192.168.1.55');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (7, 2, 10, '', '水贴之王', 5, '收到，一定遵守规范。', 1699010000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (8, 3, 20, '从 PHP 到 TypeScript 的迁移心得', 'bsd_fan', 2, '把论坛从 PHP 5.2 迁移到 TypeScript 的过程记录一下。

[b]架构选择[/b]
最终用了 Next.js App Router + 原生 PostgreSQL 参数化查询，服务端组件直连数据库，省掉一层 API。

[b]类型收窄[/b]
原来 PHP 的数组乱来惯了，TS 里严格模式会教你重新做人。所有查询结果先定义 interface，参数全部显式标注。

[code]const rows = await query<PostRow>(
  "SELECT tid, title FROM threads WHERE forumid = $1", [fid]
);[/code]

[b]总结[/b]
迁移虽苦，但静态检查和 IDE 补全带来的收益远超预期。有疑问回帖交流。', 1700500000, 0, 0, '', '', '192.168.1.10');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (9, 3, 20, '', 'php老兵', 4, '需要的，全局 Pool 复用即可，参考我的帖子里的写法。', 1700900000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (10, 3, 20, 'RE: 迁移心得', 'bsd_fan', 2, '同感。原生 SQL + 参数化查询在服务端组件里直接 await，太爽了。', 1700910000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (13, 4, 22, 'RE: PG 17', 'admin', 1, '我们论坛就是 PG 17 跑的，稳。', 1700851000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (12, 4, 22, 'PostgreSQL 17 有哪些值得升级的新特性', 'admin', 1, 'PG 17 已经发布一段时间了，总结几个值得关注的特性：

[b]1. VACUUM 内存优化[/b]
新的 vacuum 内存策略让大表维护快了很多。

[b]2. 增量备份（pg_basebackup）[/b]
内置增量备份终于来了，不再必须上 pgBackRest。

[b]3. MERGE 命令增强[/b]
RETURNING 支持让 upsert 场景更顺手。

[b]4. 逻辑复制改进[/b]
故障切换后订阅不再需要重建。

我们论坛就是 PG 17 跑的，目前稳定。大家升级过程遇到什么坑欢迎交流。', 1700600000, 0, 0, '', '', '127.0.0.1');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (14, 4, 22, '', '月光骑士', 3, '还在 16，观察一波再说。', 1700852000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (15, 5, 21, '用现代 CSS 复刻 Bootstrap 2 时代界面', '月光骑士', 3, '最近用 Tailwind 4 复刻了 Bootstrap 2 的论坛界面，总结一些复刻技巧。

[b]配色[/b]
经典 navbar 渐变 #333333 → #222222，栏目头 #3083BE 实色 + 白字加粗，行悬停 #F0F0F0。

[b]圆角[/b]
那个年代圆角只有 3px，别用现在流行的 12px，气质完全不对。

[b]表格感[/b]
1px #DDD 边框 + 斑马纹 #F9F9F9，紧凑 12-13px 字号，这些是「表格时代」的灵魂。

蓝条 #3083BE 一出来，DNA 动了。大家还想看哪些经典界面的复刻？', 1700700000, 0, 0, '', '', '192.168.1.33');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (16, 5, 21, '', '月光骑士', 3, '蓝条 #3083BE 一出来，DNA 动了。', 1700801000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (17, 6, 30, '[投票] 你最早用的论坛程序是哪个？', 'php老兵', 4, '看到版块里聊起各自的老论坛，干脆开个投票：

你人生中第一个注册的论坛是用什么程序搭的？

[list]
[*]Discuz! —— 论坛界的国民级
[*]PHPWind —— 阿里系，当年与 DZ 分庭抗礼
[*]BMForum —— 标签功能首创，BSD 模板经典
[*]phpBB —— 国际范，插件生态庞大
[*]其他 —— 动网、雷傲、CTB……欢迎回帖补充
[/list]

老玩家们来投一票，顺便讲讲你和它的故事。', 1700750000, 0, 0, '', '', '192.168.1.44');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (18, 6, 30, '', 'php老兵', 4, 'Discuz！当年大学 BBS 全靠它。', 1700881000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (19, 6, 30, '', '月光骑士', 3, 'PHPWind 也有，界面很清新。', 1700882000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (20, 7, 31, '晒出你的老论坛收藏：BMForum、Discuz、PHPWind', 'php老兵', 4, '收拾硬盘翻出当年的论坛程序安装包，晒一下收藏：

[b]BMForum 7[/b]
BSD12 模板 + 标签系统，国内首创标签功能，evidence 还在硬盘里躺着。

[b]Discuz! 6.0[/b]
真正的国民论坛，UCenter 整合那是当年的标配。

[b]PHPWind 8.5[/b]
界面精致，模版引擎当时很先进。

[b]动网论坛 DVBBS[/b]
ASP 时代霸主，多少人第一个论坛是它。

你们的收藏呢？欢迎晒图。', 1700800000, 0, 0, '', '', '192.168.1.44');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (21, 7, 31, '', 'php老兵', 4, 'BMForum 的标签功能当年是国内首创，超前了。', 1700861000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (24, 10, 11, '建议增加夜间模式', 'admin', 1, '看了下站里的活跃时间，晚上 10 点以后发帖占比很高，建议考虑加一个夜间模式。

初步想法：
1. 换一套低亮度配色（背景 #222，文字 #ccc）
2. 站点设置里加开关，会员可以在控制面板自选
3. 头部导航加一个快速切换按钮

大家觉得怎么样？欢迎在下面回帖讨论。', 1700650000, 0, 0, '', '', '127.0.0.1');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (25, 10, 11, '', 'admin', 1, '收到建议，已列入计划，感谢反馈。', 1700661000, 0, 0, '', '', '');
INSERT INTO public."posts" ("id", "tid", "forumid", "articletitle", "username", "usrid", "articlecontent", "timestamp", "changtime", "posttrash", "sellbuyer", "editinfo", "ip") VALUES (26, 15, 30, '交易标签功能演示（出售/礼金/求赏）', 'bsd_fan', 2, '[gift=10]感谢大家参与本版块的交易功能测试！[/gift]', 1789919379, 1789921630, 0, '', '1789921630|bsd_fan', '127.0.0.1');

INSERT INTO public."primsg" ("id", "belong", "sender", "sendto", "prtitle", "prcontent", "prtime", "prread", "prtype") VALUES (1, '月光骑士', 'admin', '月光骑士', '欢迎加入 BMForum', '欢迎注册本论坛，有问题随时反馈！', 1700100000, 1, 'r');
INSERT INTO public."primsg" ("id", "belong", "sender", "sendto", "prtitle", "prcontent", "prtime", "prread", "prtype") VALUES (2, 'admin', '月光骑士', 'admin', 'RE: 欢迎加入', '谢谢管理员！', 1700150000, 1, 'r');
INSERT INTO public."primsg" ("id", "belong", "sender", "sendto", "prtitle", "prcontent", "prtime", "prread", "prtype") VALUES (3, '月光骑士', 'bsd_fan', '月光骑士', '一起搞复古皮肤吗', '看到你在怀旧区的帖子，有兴趣一起复刻 bsd07 吗？', 1700200000, 0, 'r');
INSERT INTO public."primsg" ("id", "belong", "sender", "sendto", "prtitle", "prcontent", "prtime", "prread", "prtype") VALUES (5, 'bsd_fan', 'bsd_fan', 'admin', '回归消息', '回归测试内容', 1789912129, 0, 's');
INSERT INTO public."primsg" ("id", "belong", "sender", "sendto", "prtitle", "prcontent", "prtime", "prread", "prtype") VALUES (4, 'admin', 'bsd_fan', 'admin', '回归消息', '回归测试内容', 1789912129, 1, 'r');
INSERT INTO public."primsg" ("id", "belong", "sender", "sendto", "prtitle", "prcontent", "prtime", "prread", "prtype") VALUES (7, 'admin', 'admin', 'inv_reg_ok', 'probe', 'probe', 1789912555, 0, 's');

INSERT INTO public."tags" ("tagid", "tagname", "threads") VALUES (2, '经典论坛', 2);
INSERT INTO public."tags" ("tagid", "tagname", "threads") VALUES (3, 'PHP', 2);
INSERT INTO public."tags" ("tagid", "tagname", "threads") VALUES (4, 'PostgreSQL', 3);
INSERT INTO public."tags" ("tagid", "tagname", "threads") VALUES (5, '前端', 1);
INSERT INTO public."tags" ("tagid", "tagname", "threads") VALUES (6, '怀旧', 3);
INSERT INTO public."tags" ("tagid", "tagname", "threads") VALUES (7, '灌水', 2);
INSERT INTO public."tags" ("tagid", "tagname", "threads") VALUES (17, '冒烟', 1);
INSERT INTO public."tags" ("tagid", "tagname", "threads") VALUES (1, 'BMForum', 2);
INSERT INTO public."tags" ("tagid", "tagname", "threads") VALUES (8, '公告', 2);

INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (2, 8);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (3, 3);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (3, 4);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (4, 4);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (5, 5);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (5, 6);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (6, 7);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (6, 6);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (7, 6);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (7, 1);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (7, 2);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (8, 7);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (9, 4);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (9, 3);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (10, 2);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (1, 1);
INSERT INTO public."thread_tags" ("tid", "tagid") VALUES (1, 8);

INSERT INTO public."threads" ("tid", "forumid", "toptype", "ttrash", "title", "content", "author", "authorid", "time", "changetime", "hits", "replys", "lastreply", "islock", "ttype", "ttagname", "ttagid", "diggcount", "digguser", "newdesc", "digest", "type") VALUES (6, 30, 0, 0, '[投票] 你最早用的论坛程序是哪个？', '来投个票，看看大家都是从什么年代过来的！', 'php老兵', 4, 1700750000, 1700880000, 313, 2, '月光骑士', 0, 1, '灌水,怀旧', '7,6', 15, '', '', 0, 1);
INSERT INTO public."threads" ("tid", "forumid", "toptype", "ttrash", "title", "content", "author", "authorid", "time", "changetime", "hits", "replys", "lastreply", "islock", "ttype", "ttagname", "ttagid", "diggcount", "digguser", "newdesc", "digest", "type") VALUES (2, 10, 1, 0, '[公告] 论坛发帖规范 v2', '为维护论坛秩序，请遵守以下规范：[quote]1. 禁止灌水广告；2. 标题明确；3. 尊重他人[/quote]违规将被扣分处理。', '水贴之王', 5, 1699000000, 1699000000, 263, 1, '水贴之王', 0, 0, '公告', '8', 5, '', '', 0, 0);
INSERT INTO public."threads" ("tid", "forumid", "toptype", "ttrash", "title", "content", "author", "authorid", "time", "changetime", "hits", "replys", "lastreply", "islock", "ttype", "ttagname", "ttagid", "diggcount", "digguser", "newdesc", "digest", "type") VALUES (3, 20, 0, 0, '从 PHP 迁移到 TypeScript 的心得', '十年 PHP 老兵表示：[b]TypeScript 的类型系统真的香[/b]。用 node-postgres 原生驱动连接 PG，配合 Next.js 服务端组件，开发体验拉满。附上连接池代码：[code]import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { rows } = await pool.query("SELECT * FROM threads LIMIT 10");[/code]', 'bsd_fan', 2, 1700500000, 1700900000, 189, 3, 'bsd_fan', 0, 0, 'PHP,PostgreSQL', '3,4', 8, '', '', 0, 0);
INSERT INTO public."threads" ("tid", "forumid", "toptype", "ttrash", "title", "content", "author", "authorid", "time", "changetime", "hits", "replys", "lastreply", "islock", "ttype", "ttagname", "ttagid", "diggcount", "digguser", "newdesc", "digest", "type") VALUES (4, 22, 0, 0, 'PostgreSQL 17 有哪些值得升级的新特性', 'PG 17 的 VACUUM 性能提升、MERGE 增强都很实用。大家的生产环境都升级了吗？', 'admin', 1, 1700600000, 1700850000, 143, 2, 'admin', 0, 0, 'PostgreSQL', '4', 6, '', '', 0, 0);
INSERT INTO public."threads" ("tid", "forumid", "toptype", "ttrash", "title", "content", "author", "authorid", "time", "changetime", "hits", "replys", "lastreply", "islock", "ttype", "ttagname", "ttagid", "diggcount", "digguser", "newdesc", "digest", "type") VALUES (5, 21, 0, 0, '用现代 CSS 复刻 Bootstrap 2 时代界面', '渐变按钮、圆角输入框、table 布局……复刻老论坛界面比想象中有趣。核心是把 .announcement 蓝条还原出来。', '月光骑士', 3, 1700700000, 1700800000, 98, 1, '月光骑士', 0, 0, '前端,怀旧', '5,6', 4, '', '', 0, 0);
INSERT INTO public."threads" ("tid", "forumid", "toptype", "ttrash", "title", "content", "author", "authorid", "time", "changetime", "hits", "replys", "lastreply", "islock", "ttype", "ttagname", "ttagid", "diggcount", "digguser", "newdesc", "digest", "type") VALUES (7, 31, 0, 0, '晒出你的老论坛收藏：BMForum、Discuz、PHPWind', '那些年的三大 PHP 论坛程序，谁还记得「主题随意贴」这个功能？', 'php老兵', 4, 1700800000, 1700860000, 176, 1, 'php老兵', 0, 0, '怀旧,BMForum,经典论坛', '6,1,2', 9, '', '', 0, 0);
INSERT INTO public."threads" ("tid", "forumid", "toptype", "ttrash", "title", "content", "author", "authorid", "time", "changetime", "hits", "replys", "lastreply", "islock", "ttype", "ttagname", "ttagid", "diggcount", "digguser", "newdesc", "digest", "type") VALUES (10, 11, 0, 0, '建议增加夜间模式', '如题，晚上看论坛太亮了。', 'admin', 1, 1700650000, 1700660000, 45, 1, 'admin', 0, 0, '经典论坛', '2', 3, '', '', 0, 0);
INSERT INTO public."threads" ("tid", "forumid", "toptype", "ttrash", "title", "content", "author", "authorid", "time", "changetime", "hits", "replys", "lastreply", "islock", "ttype", "ttagname", "ttagid", "diggcount", "digguser", "newdesc", "digest", "type") VALUES (1, 10, 0, 0, '[公告] BMForum 复刻版正式上线', '经过努力，BMForum 7 的 TypeScript + PostgreSQL 复刻版正式上线！[b]功能包括：[/b][list]分类版块、主题回帖、BMBCode、标签、投票、短消息、在线列表、后台管理[/list]欢迎体验。', 'bsd_fan', 2, 1700000000, 1700000000, 378, 4, '月光骑士', 0, 0, 'BMForum,公告', '1,8', 12, '', '', 1, 0);
INSERT INTO public."threads" ("tid", "forumid", "toptype", "ttrash", "title", "content", "author", "authorid", "time", "changetime", "hits", "replys", "lastreply", "islock", "ttype", "ttagname", "ttagid", "diggcount", "digguser", "newdesc", "digest", "type") VALUES (8, 30, 0, 0, '今天天气不错，出来冒个泡', '水一水，涨积分。', '水贴之王', 5, 1700900000, 1700910000, 89, 0, '', 0, 0, '灌水', '7', 1, '', '', 0, 0);
INSERT INTO public."threads" ("tid", "forumid", "toptype", "ttrash", "title", "content", "author", "authorid", "time", "changetime", "hits", "replys", "lastreply", "islock", "ttype", "ttagname", "ttagid", "diggcount", "digguser", "newdesc", "digest", "type") VALUES (9, 20, 0, 0, 'Node.js 里怎么优雅地写数据库迁移脚本', '用纯 SQL 文件 + 启动脚本执行，比 ORM 迁移更直观，大家怎么看？', '月光骑士', 3, 1700850000, 1700890000, 72, 0, '', 0, 0, 'PostgreSQL,PHP', '4,3', 2, '', '', 0, 0);
INSERT INTO public."threads" ("tid", "forumid", "toptype", "ttrash", "title", "content", "author", "authorid", "time", "changetime", "hits", "replys", "lastreply", "islock", "ttype", "ttagname", "ttagid", "diggcount", "digguser", "newdesc", "digest", "type") VALUES (15, 30, 0, 0, '交易标签功能演示（出售/礼金/求赏）', '本帖演示原版 BMForum 的三大交易标签。

[gift=10]礼金演示：楼主可以用 [gift=金额] 给回复的会员发放礼金，点击下方帖子右下角的“发礼金”即可。[/gift]', 'bsd_fan', 2, 1789919379, 1789953781, 11, 1, 'admin', 0, 0, '', '', 0, '', '演示出售、礼金、求赏三种交易标签的实际效果。', 0, 0);

INSERT INTO public."usergroup" ("id", "groupname", "groupicon", "showsort", "canview", "canpost", "canreply", "canupload", "canvote", "canpm", "candigg", "cansearch") VALUES (2, '版主', 'moderator.gif', 2, 1, 1, 1, 1, 1, 1, 1, 1);
INSERT INTO public."usergroup" ("id", "groupname", "groupicon", "showsort", "canview", "canpost", "canreply", "canupload", "canvote", "canpm", "candigg", "cansearch") VALUES (3, '管理员', 'administrator.gif', 3, 1, 1, 1, 1, 1, 1, 1, 1);
INSERT INTO public."usergroup" ("id", "groupname", "groupicon", "showsort", "canview", "canpost", "canreply", "canupload", "canvote", "canpm", "candigg", "cansearch") VALUES (4, '封禁用户', 'ban.gif', 4, 1, 0, 0, 0, 0, 0, 0, 0);
INSERT INTO public."usergroup" ("id", "groupname", "groupicon", "showsort", "canview", "canpost", "canreply", "canupload", "canvote", "canpm", "candigg", "cansearch") VALUES (0, '游客', 'guest.gif', 0, 1, 0, 0, 0, 0, 0, 1, 1);
INSERT INTO public."usergroup" ("id", "groupname", "groupicon", "showsort", "canview", "canpost", "canreply", "canupload", "canvote", "canpm", "candigg", "cansearch") VALUES (1, '注册会员', 'member.gif', 1, 1, 1, 1, 1, 1, 1, 1, 1);

INSERT INTO public."userlist" ("userid", "username", "pwd", "salt", "mailadd", "usergroup", "regdate", "signtext", "homepage", "fromwhere", "desper", "headtitle", "postamount", "point", "money", "lastlogin", "lastpost", "avatar", "sex", "birthday", "online_status", "digestmount") VALUES (4, 'php老兵', '536cf96b246b53ec268852de87087fc740f733153923ea90ead2bec5c6927b16', 'b19780dd588bf92a', 'vet@bmforum.dev', 1, '2008-06-30', 'PHP 是世界上最好的语言（狗头）', '', '北京', '写了十年 PHP 的老码农。', '', 67, 2300, 8800, 0, 0, '', 'm', '1983-04-18', 'online', 0);
INSERT INTO public."userlist" ("userid", "username", "pwd", "salt", "mailadd", "usergroup", "regdate", "signtext", "homepage", "fromwhere", "desper", "headtitle", "postamount", "point", "money", "lastlogin", "lastpost", "avatar", "sex", "birthday", "online_status", "digestmount") VALUES (5, '水贴之王', '337e1adcafb4dd742b49b431c86faeaeaa6f6577545181048339a0ccf059be1e', '02d97f9930d30498', 'water@bmforum.dev', 1, '2015-02-14', '灌水使我快乐。', '', '成都', '专业灌水二十年。', '', 210, 800, 3200, 0, 0, '', 'm', '1995-12-05', 'online', 0);
INSERT INTO public."userlist" ("userid", "username", "pwd", "salt", "mailadd", "usergroup", "regdate", "signtext", "homepage", "fromwhere", "desper", "headtitle", "postamount", "point", "money", "lastlogin", "lastpost", "avatar", "sex", "birthday", "online_status", "digestmount") VALUES (2, 'bsd_fan', 'ed77180a5e7c86fdee5ce3e65a0a420bce884aaf7dd0e423f04bfea727c92fbf', '193e9b0d3b521e83', 't@t.io', 1, '2007-03-15', '', '', '测试城市', '老论坛程序爱好者，收集各种经典皮肤。', '', 88, 3200, 11989, 1789921630, 1789919412, '/api/attachment/3', '男', '1990-01-01', 'online', 0);
INSERT INTO public."userlist" ("userid", "username", "pwd", "salt", "mailadd", "usergroup", "regdate", "signtext", "homepage", "fromwhere", "desper", "headtitle", "postamount", "point", "money", "lastlogin", "lastpost", "avatar", "sex", "birthday", "online_status", "digestmount") VALUES (3, '月光骑士', '4ac7b32318b76bd3df9cbd179d5b9840c928533b04a58c9de5c2313f10180d0c', 'e36a14496163a9b4', 'moon@bmforum.dev', 1, '2010-11-02', '潜水多年，偶尔冒泡。', '', '广州', '普通坛友一枚。', '', 47, 1500, 5600, 1789923602, 1789918828, '', 'f', '1990-09-21', 'online', 0);
INSERT INTO public."userlist" ("userid", "username", "pwd", "salt", "mailadd", "usergroup", "regdate", "signtext", "homepage", "fromwhere", "desper", "headtitle", "postamount", "point", "money", "lastlogin", "lastpost", "avatar", "sex", "birthday", "online_status", "digestmount") VALUES (1, 'admin', 'eadc83e83c738a08ea45017105732a0eb0167d97fea7e4fafdeb6c86adc5e7e6', 'e188080bae72e078', 'admin@bmforum.dev', 3, '2005-08-01', '论坛的管理员，有问题请找我。', '', '管理后台', '负责论坛日常维护与安全管理。', '管理员', 132, 9999, 50011, 1789953781, 1789919172, '', 'm', '1980-01-01', 'online', 0);

INSERT INTO public."wordfilter" ("id", "find", "replacewith") VALUES (1, '垃圾广告', '**');
INSERT INTO public."wordfilter" ("id", "find", "replacewith") VALUES (2, '混蛋', '**');

SELECT setval('public.actlogs_id_seq', 1, true);
SELECT setval('public.adminlog_id_seq', 29, true);
SELECT setval('public.announces_id_seq', 4, true);
SELECT setval('public.attachments_id_seq', 3, true);
SELECT setval('public.contacts_id_seq', 3, true);
SELECT setval('public.favorites_id_seq', 4, true);
SELECT setval('public.forumdata_id_seq', 37, true);
SELECT setval('public.forumlog_id_seq', 9, true);
SELECT setval('public.invitecode_id_seq', 4, true);
SELECT setval('public.ipban_id_seq', 2, true);
SELECT setval('public.notification_nid_seq', 6, true);
SELECT setval('public.posts_id_seq', 29, true);
SELECT setval('public.primsg_id_seq', 10, true);
SELECT setval('public.tags_tagid_seq', 19, true);
SELECT setval('public.threads_tid_seq', 20, true);
SELECT setval('public.userlist_userid_seq', 12, true);
SELECT setval('public.wordfilter_id_seq', 4, true);

COMMIT;
