# 项目上下文

## 项目概览

BMForum 7 论坛系统复刻（对照 assets/BMF7.tar.gz 原始 PHP 源码逐功能实现）。
核心模块与关键文件：

- **BMBCode 渲染**：`src/lib/bmbcode.ts` —— parseBmbCode(content, attachMap, tradeCtx?)；交易标签 [sell=金额]/[gift=金额]/[beg] 需要 TradeCtx（帖子买卖家、beg 流水、金钱单位）才能渲染遮罩/按钮；表情 [s:xxx] 走 EMOTICONS
- **交易（原版 sell.php）**：API `src/app/api/posts/[id]/trade/route.ts`，action=buy/refund/gift/beg；钱流：购买扣买家给作者、退款全额退买家、礼金由主题作者发给回复作者（每作者一次）、求赏捐给帖子作者；流水表 beg（id = 帖子id+"1"/"3"、主题id+"2"），posts.sellbuyer 存买家 userid 逗号列表
- **帖子编辑（原版 post.php modify）**：API `src/app/api/posts/[id]/edit`，页面 `/post?edit=帖子id`（首帖可改标题/主题简介 newdesc/标签，同步 thread_tags 计数）
- **主题简介**：threads.newdesc，发帖/编辑表单字段，版块主题列表标题下显示
- **举报（原版 report.php）**：API `src/app/api/report`，PM 通知版主/管理员 + forumlog
- **验证码（原版 authimg.php）**：`src/lib/captcha.ts`（无状态 HMAC token，SECRET=BMF_CAPTCHA_SECRET||DATABASE_URL），GET /api/captcha，注册接口强制校验
- **后台管理** `/admin`：版块/公告/用户/用户组/回收站/敏感词/IP封禁/邀请/站点设置(bbs_config)/禁注名单(banname)/附件管理/日志(adminlog+forumlog)/缓存重建；面板组件在 `src/components/bmf/admin-panels.tsx`（客户端统一 POST {action,...}，路由需同时支持 POST action 分支）
- **站点设置**：bbs_config 表（bbs_title/bbs_des/welcomemess/closereg/moneyunit/perpage）；layout 读 bbs_title，主题页读 perpage，注册读 closereg，交易渲染读 moneyunit
- **数据库**：本地 PG `postgres://postgres:bmf7pass@localhost:5432/bmf7`；结构 `db/schema.sql`（生产首建）、增量 `db/migrate*.sql`、种子 `db/seed.sql`（改动表结构/种子数据后需重新 pg_dump 导出）；生产环境由 `scripts/prod-db.mjs` 引导（远程 DATABASE_URL 优先/本机嵌入式兜底）

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
