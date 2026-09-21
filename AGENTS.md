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
- **数据库**：本地 PG `postgres://postgres:bmf7pass@localhost:5432/bmf7`（嵌入式 PostgreSQL，数据目录 `/tmp/bmf7-pgdata` 可能被系统清理）；结构 `db/schema.sql`（空库自动首建）、增量 `db/migrate*.sql`、种子 `db/seed.sql`（改动表结构/种子数据后用 `node scripts/dump-seed.mjs` 重导——环境无 pg_dump，纯 node pg 实现，导出前先清理运行时表 sessions/onlinestat/notification/primsg 测试残留）；`scripts/prod-db.mjs` 引导（远程 DATABASE_URL 优先/本机嵌入式兜底；**空库时自动 schema.sql 建表 → seed.sql 灌数**），dev.sh 与 start.sh 启动时均自动执行（自愈）；**演示账号 admin/bsd_fan/月光骑士/php老兵/水贴之王 密码统一 123456**
- **会话认证**：cookie `bmf_sid`（sessions 表，`src/lib/auth.ts`）；**cookie 属性按 x-forwarded-proto 动态切换**：https 访问（含 iframe 预览的跨站上下文）用 `SameSite=None; Secure`，http 用 `SameSite=Lax`——否则 iframe 中登录后 cookie 被浏览器阻止，表现为"登录成功但仍是未登录状态"；登录/注册成功后前端用 `window.location.assign("/")` 全量跳转（auth-form.tsx），退出登录 GET /api/auth/logout 返回相对路径 307

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
