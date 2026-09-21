# 项目上下文

## 项目概览

BMForum 7 论坛系统复刻（对照 assets/BMF7.tar.gz 原始 PHP 源码逐功能实现）。
核心模块与关键文件：

- **BMBCode 渲染**：`src/lib/bmbcode.ts` —— parseBmbCode(content, attachMap, tradeCtx?, viewerCtx?)；交易标签 [sell=金额]/[pay=金额]/[gift=金额]/[beg] 需要 TradeCtx（帖子买卖家、beg 流水、金钱单位）才能渲染遮罩/按钮；隐藏类标签 [post]/[hpost=N]/[hmoney=M]/[hide=积分] 走 ViewerCtx（hasReplied/postamount/money/point/privileged）条件显示，作者/版主/管理员恒可见，遮罩不泄露原文；另有 [align]/[sub]/[sup]/[glow=W,color]/[shadow=W,color]；表情 [s:xxx] 走 EMOTICONS
- **交易（原版 sell.php）**：API `src/app/api/posts/[id]/trade/route.ts`，action=buy/refund/gift/beg；钱流：购买扣买家给作者、退款全额退买家、礼金由主题作者发给回复作者（每作者一次）、求赏捐给帖子作者；流水表 beg（id = 帖子id+"1"/"3"、主题id+"2"），posts.sellbuyer 存买家 userid 逗号列表
- **帖子编辑（原版 post.php modify）**：API `src/app/api/posts/[id]/edit`，页面 `/post?edit=帖子id`（首帖可改标题/主题简介 newdesc/标签，同步 thread_tags 计数）
- **主题简介**：threads.newdesc，发帖/编辑表单字段，版块主题列表标题下显示
- **举报（原版 report.php）**：API `src/app/api/report`，PM 通知版主/管理员 + forumlog
- **验证码（原版 authimg.php）**：`src/lib/captcha.ts`（无状态 HMAC token，SECRET=BMF_CAPTCHA_SECRET||DATABASE_URL），GET /api/captcha，注册接口强制校验
- **好友/联系人（原版 friendlist.php）**：contacts 表（owner/contacts/conname/adddate/type：0=好友 1=特别关注 2=黑名单）；API `src/app/api/contacts`（GET 联表 userlist 返回 {ok,list}，POST 兼容 {username,type} 与 {action:add/del/clean,name,type}，DELETE {username}）；控制面板 `/usercp?tab=contacts` 分组管理（usercp-extras.tsx ContactsManager）；profile 页 ContactQuickActions（contact-actions.tsx）加好友/拉黑，isSelf 隐藏
- **版主前台日志（原版 forumlogs.php）**：页面 `/forumlogs/[fid]`（版主/管理员/本版 blad 校验，ACTION_NAMES 动作映射，分页 20 条），管理员可清空（LogCleanButton → POST /api/forumlogs {action:"clean",fid}，仅 usergroup===3）；时间格式 fmtFullDate（format.ts）
- **后台管理** `/admin`：版块/公告/用户/用户组/回收站/敏感词/IP封禁/邀请/站点设置(bbs_config)/禁注名单(banname)/附件管理/日志(adminlog+forumlog)/缓存重建；面板组件在 `src/components/bmf/admin-panels.tsx`（客户端统一 POST {action,...}，路由需同时支持 POST action 分支）
- **站点设置**：bbs_config 表（bbs_title/bbs_des/welcomemess/closereg/moneyunit/perpage）；layout 读 bbs_title，主题页读 perpage，注册读 closereg，交易渲染读 moneyunit
- **投票系统（原版 vote.php/poll.htm）**：polls.setting 含 maxchoose/viewafter/deadline/minposts；POST `/api/threads/[tid]/vote` {choices:[...]}（登录/canvote/未锁定/未投过/多选上限/到期/最低发帖数校验）；列表图标 threads.type=1；帖子页 PollBox（viewafter 未投不显结果、参与者下拉、到期截止、比例条）；发帖表单投票设置（单选/多选/最多可选/投票后可见/到期日/最低发帖）
- **主题管理（原版 manage.php/manage2.php）**：POST `/api/threads/[tid]/manage` action=sticky(level 0-3 分级置顶)/digest(加精联动作者 digestmount±1+版块 digestcount±1)/lock/front(提前)/move/copy(复制主题+计数)/trash/delete(楼主可自删 0 回复主题并扣作者积分)；单帖管理 POST `/api/posts/[id]/manage` action=trash/del/recover（posttrash 列，版主在帖内可见"恢复"）；帖子页 TopicTools 工具栏
- **帖子细节**：posts.editinfo（"时间戳|用户名"，渲染 `[此帖于 T 由 X 编辑]`）；posts.ip（发帖 IP，仅版主/管理员可见）；发帖/回复/编辑记录 IP；PostEditor 交易复选框（出售金额/礼金金额/求赏，自动包裹 [pay=]/[gift=]/[beg]）
- **所见即所得编辑器（复刻原版 nicEdit panelInstance）**：`src/components/bmf/rich-editor.tsx` + 转换核心 `src/lib/rich-text.ts`；双模式（富文本 contentEditable / BMBCode 源码）工具栏（B/I/U/S/上下标/对齐/列表/缩进/链接/图片/引用/代码/表情/字号/颜色），提交前经 `RichEditorHandle.getBmbcode()` 转回 BMBCode；交易/隐藏类标签在编辑态原样显示；**首帖判定约定 = 该 tid 下 min(posts.id)**（种子/测试数据须保证首帖 id 最小）
- **首页**：在线列表（whosonline）+ 今日生日块（userlist.birthday 匹配当天 MM-DD，显示 名字(年龄)）
- **短消息（原版 messenger.php）**：inbox/outbox + action=clear 清空信箱（ClearBoxButton）
- **数据库**：生产接入 Supabase 托管 PG（平台注入 `PGDATABASE_URL` 环境变量，数据跨部署持久化；开发兜底本地嵌入式 PG `postgres://postgres:bmf7pass@localhost:5432/bmf7`，数据目录 `/tmp/bmf7-pgdata`）；结构 `db/schema.sql`（空库自动首建）、增量 `db/migrate*.sql`（幂等，prod-db.mjs 每次启动兜底执行）、种子 `db/seed.sql`（改动表结构/种子数据后用 `node scripts/dump-seed.mjs` 重导——环境无 pg_dump，纯 node pg 实现，导出前先清理运行时表 sessions/onlinestat/notification/primsg 测试残留）；`scripts/prod-db.mjs` 引导（PGDATABASE_URL/DATABASE_URL 远程优先 → 本机嵌入式兜底；**空库时 schema.sql 建表 → migrate 增量 → seed.sql 灌数**），dev.sh 与 start.sh 启动时均自动执行（自愈）；`src/lib/db.ts` 连接池按连接串变化自动重建（HMR 改配置免重启）；**演示账号 admin/bsd_fan/月光骑士/php老兵/水贴之王 密码统一 123456**
- **会话认证**：cookie `bmf_sid`（sessions 表，`src/lib/auth.ts`）；**cookie 属性按 x-forwarded-proto 动态切换**：https 访问（含 iframe 预览的跨站上下文）用 `SameSite=None; Secure`，http 用 `SameSite=Lax`——否则 iframe 中登录后 cookie 被浏览器阻止，表现为"登录成功但仍是未登录状态"；登录/注册成功后前端用 `window.location.assign("/")` 全量跳转（auth-form.tsx），退出登录 GET /api/auth/logout 返回相对路径 307
- **时区**：全站统一东八区。三层保障：dev.sh/start.sh `export TZ=Asia/Shanghai`（Node 进程）；prod-db.mjs 建库后 `ALTER DATABASE ... SET timezone TO 'Asia/Shanghai'`；`src/lib/format.ts` fmtTime/fmtDate/fmtFullDate/fmtShortTime/cnYear/cnDayStart 显式 +8 偏移计算（勿在组件里直接用 Date.now/new Date 格式化——ESLint react-hooks/purity 会拦截，走 format.ts 辅助函数）；生日匹配 SQL 用 `now() AT TIME ZONE 'Asia/Shanghai'`

## 历史踩坑记录（MUST READ——每条都真实发生过，勿重犯）

### 数据库 / 部署类（两次部署失败均源于此）

1. **空库引导漏建表 → 部署全站 500**（第 1 次部署失败）：prod-db.mjs 空库分支曾只灌 seed.sql（纯 INSERT）而不执行 schema.sql，生产首次启动 `relation "xxx" does not exist`。**规范**：任何"空库初始化"流程必须 schema 建表在前、种子灌入在后；改动 prod-db.mjs 后必须 DROP 库重建空库完整重演一遍再交付。
2. **种子里的 bytea 字面量格式错误 → 灌库失败**（第 2 次部署失败）：dump-seed.mjs 曾生成 `decode('\x...','hex')`——`\x` 是 escape 格式转义，PG hex 格式只接受纯十六进制。**规范**：生成 SQL 字面量后必须真实执行一遍验证（本地空库灌入），不能只看文件内容像对就行。
3. **环境没有 pg_dump/psql**：embedded-postgres 只带 initdb/pg_ctl/postgres 三个二进制，系统 PATH 里也没有客户端工具。**规范**：种子导出用 `node scripts/dump-seed.mjs`（纯 node pg 实现）；验证性查询用 `node -e` + node_modules/pg。
4. **种子混入运行时数据**：直接导全库会把 sessions/onlinestat/notification/primsg、测试期间产生的 adminlog 等一起带进种子基线。**规范**：dump-seed.mjs 导出前先清运行时表与测试残留，导出后 grep 各表行数对账。
5. **/tmp/bmf7-pgdata 会被系统清理**：PG 进程与数据目录随时可能消失，表现为全站 ECONNREFUSED 500。**规范**：不要手动救数据——dev.sh/start.sh 启动时自动跑 prod-db.mjs 自愈（缺失即 initdb+灌种子），重启预览即可恢复。
6. **重新部署 = 数据重置为种子基线**（已解决）：生产容器数据库曾在 /tmp、随容器销毁导致用户数据丢失。**已接入平台注入的 Supabase 托管 PG（`PGDATABASE_URL`，prod-db.mjs/db.ts 远程优先），数据跨部署持久化**；本机嵌入式仅作兜底（远程库不可达时降级，此时数据仅容器内有效）。排查数据问题时先确认连的是哪个库（走远程时 PGHOST 为 *.pg2.aidap-*.volces.com）。
7. **psql/node 单条 query 多语句不原子**：多步 DML（如批量 id 重排）中途失败会留下半完成状态，重试还会撞唯一键。**规范**：批量数据变更一律用 node pg 显式事务（BEGIN/COMMIT），出错回滚重跑。
8. **posts.id 重排**：直接链式 UPDATE 会撞主键冲突，需借助临时偏移（+100000 → 200000+new → new）分步落位；且**首帖判定 = 该 tid 下 min(posts.id)**，任何数据操作必须保证首帖 id 最小。
9. **schema.sql 落后于增量迁移 → 全新库缺列**：contacts.type 等列是后来经 db/migrate*.sql 增量加的而 schema.sql 未同步，空库引导只跑 schema+seed 时新库缺列，好友接口 500（`column "contacts.type" does not exist`）。**已修复**：prod-db.mjs 的 ensureSchema 每次启动幂等兜底执行全部 migrate。**规范**：新增列时写 migrate 后评估是否同步进 schema.sql；交付前用 information_schema 对新旧库做列级对账（单表 count 对不出来）。

### 前端 / 规范类

10. **iframe 预览中登录失效**：站点常被嵌入 iframe（跨站上下文），`SameSite=Lax` 的 cookie 被浏览器阻止，表现为"登录返回成功但刷新后未登录"。**规范**：会话 cookie 按 x-forwarded-proto 动态切换——https 用 `SameSite=None; Secure`（auth.ts sessionCookieOptions），登录/注册成功后用 `window.location.assign("/")` 全量跳转。
11. **ESLint react-hooks/purity 拦截渲染期不纯调用**：Server Component 里直接写 `Date.now()`/`Math.random()` 会 lint 报错。**规范**：时间/随机相关计算封装进 `src/lib/format.ts` 辅助函数（cnYear/cnDayStart 等）再引用。
12. **服务器容器时区是 UTC**：任何 `new Date().getHours()`/`toLocaleString()`/`to_char(now())` 都会输出 UTC 时间。**规范**：见上方"时区"条目的三层保障；新增时间显示一律走 format.ts。
13. **新增 Tailwind 类需重新部署才进生产**：生产 CSS 是 build 产物，本地 dev 可见的 `max-md:hidden` 等新类，生产重新部署前不生效——不要误判为"适配丢失"。

### 流程类

14. **test_run 的 commands 数组是并行执行**：登录+带 cookie 请求这类顺序依赖的命令，并行跑会拿到未写入的 cookie。**规范**：顺序流程合并为单条命令用 `;` 链接。
15. **HMR 缓存旧报错**：修完代码后立即测试可能仍报修改前的错误（dev server 未重编译）。**规范**：修复后等编译完成再重试，必要时刷新页面触发重编译。
16. **改完必须真实验证再交付**：HTTP 200 ≠ 业务成功（要看响应体 ok/data 字段）；"SQL 文件写好了"≠"灌库能成功"。上述两次部署失败都是"看起来对"没实际跑过导致的。

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**
