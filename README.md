# BMForum 7 复刻

基于现代 Web 技术栈逐功能复刻经典 PHP 论坛 **BMForum 7**（BSD12「新版主题」）。保留原版的表格布局、蓝色标题条与 Web 2.0 质感，数据层从 MySQL 迁移到 PostgreSQL，前后端全部使用 TypeScript 实现。

> 本项目仅供学习交流使用。BMForum 原版程序的名称、设计及版权归原作者所有。

## 技术栈

- **框架**：Next.js 16（App Router）+ React 19 + TypeScript 5
- **样式**：Tailwind CSS 4（复刻原版 styles.css 视觉）
- **数据库**：PostgreSQL（node pg 直连，无 ORM）
- **编辑器**：所见即所得双模式编辑器（复刻原版 nicEdit panelInstance）

## 功能特性

### 内容与渲染

- **BMBCode 渲染引擎**：加粗/斜体/删除线、上下标、对齐、字号颜色、发光/阴影、引用、代码、列表、链接图片、表情 `[s:xxx]`
- **隐藏类标签**：`[post]` 回复可见、`[hpost=N]`、`[hmoney=M]`、`[hide=积分]` 条件可见（作者/版主恒可见，遮罩不泄露原文）
- **主题标签、主题简介、编辑标记**（`[此帖于 T 由 X 编辑]`）、发帖 IP 记录（仅版主可见）

### 帖子交易（对照原版 sell.php）

- 出售 `[sell=金额]` / 定价 `[pay=金额]` / 礼金 `[gift=金额]` / 求赏 `[beg]`
- 完整资金流：购买扣款给作者、退款全额返还、礼金按回复作者发放（每人一次）、求赏捐给帖子作者
- 流水表 beg 与购买者记录（posts.sellbuyer）

### 互动系统

- **投票**：单选/多选/最多可选/投票后可见/到期截止/最低发帖数
- **点赞、收藏、举报**（PM 通知版主 + 论坛日志）
- **短消息**：收发件箱、清空信箱
- **好友/联系人**：好友 / 特别关注 / 黑名单分组，个人页快捷加好友/拉黑

### 管理体系

- **版主前台操作**：分级置顶（0-3）、加精（联动积分统计）、锁定、提前、移动、复制、回收站、单帖管理（回收/删除/恢复）、版主操作日志
- **后台管理**：版块/公告/用户/用户组权限位/回收站/敏感词过滤/IP 封禁/邀请码/站点设置/禁注名单/附件管理/日志审计/缓存重建
- **验证码**：无状态 HMAC token，注册强制校验

### 体验

- 移动端适配（表格收纳与堆叠，作者信息单行紧凑条）
- 全站统一东八区时间（脚本时区 + 数据库时区 + 显式偏移三层保障）
- 首页在线列表、今日生日、公告栏、热门标签

## 快速开始

### 环境要求

- Node.js ≥ 20（推荐 24）
- pnpm（唯一包管理器）

### 启动

```bash
# 安装依赖
pnpm install

# 启动开发服务器（首次启动自动引导数据库）
pnpm dev
```

打开 http://localhost:5000 即可访问。

数据库**零配置自愈**：启动脚本按以下优先级引导——

1. 存在 `PGDATABASE_URL` / `DATABASE_URL` 且指向远程库 → 直连使用（空库或有表无数据时自动建表、补齐增量迁移、灌入演示种子）
2. 否则启动内置嵌入式 PostgreSQL（无需安装任何数据库，数据目录 `/tmp/bmf7-pgdata`）

### 构建与部署

```bash
pnpm build   # 构建
pnpm start   # 启动生产服务（监听 DEPLOY_RUN_PORT，默认 5000）
```

生产环境注入 `PGDATABASE_URL`（任何标准 PostgreSQL，如 Supabase / 云 RDS）即可实现**数据跨部署持久化**。

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `PGDATABASE_URL` | 否 | 远程 PostgreSQL 连接串（优先级最高），如 `postgresql://user:pass@host:5432/postgres?sslmode=require` |
| `DATABASE_URL` | 否 | 备选连接串；也作为验证码签名密钥的默认来源 |
| `BMF_CAPTCHA_SECRET` | 否 | 验证码 HMAC 密钥（默认取 `DATABASE_URL`） |
| `BMF_FORCE_EMBEDDED` | 否 | 设为 `1` 强制使用本机嵌入式 PostgreSQL |
| `BMF_PG_SSL` | 否 | 设为 `1` 对远程库强制开启 SSL（跳过证书校验） |
| `DEPLOY_RUN_PORT` | 否 | 服务监听端口（默认 5000） |

## 演示账号

种子数据内置 5 个演示账号，密码统一 `123456`：

| 用户名 | 角色 |
| --- | --- |
| admin | 管理员 |
| bsd_fan / 月光骑士 / php老兵 / 水贴之王 | 普通会员 / 版主 |

## 数据库维护

```
db/
├── schema.sql      # 全量表结构（空库自动首建）
├── migrate2~5.sql  # 增量迁移（幂等，每次启动自动兜底执行）
└── seed.sql        # 演示种子数据（27 表基线）
```

- 改动表结构后：新增 `ALTER ... IF NOT EXISTS` 幂等迁移，并评估是否同步进 `schema.sql`
- 重导种子：修改数据后运行 `node scripts/dump-seed.mjs`（纯 node pg 实现，导出前自动清理运行时表）
- 新列对账：交付前用 `information_schema` 对新旧库做列级对账

## 项目结构

```
├── db/                        # schema.sql / migrate*.sql / seed.sql
├── scripts/
│   ├── prod-db.mjs            # 数据库引导（远程优先 → 嵌入式兜底，空库/无数据自愈）
│   ├── dump-seed.mjs          # 种子导出器（node pg 实现）
│   ├── build.sh / start.sh / dev.sh
├── src/
│   ├── app/
│   │   ├── page.tsx           # 首页（版块表/在线/生日/公告）
│   │   ├── forums/[id]/       # 版块主题列表
│   │   ├── topic/[tid]/       # 帖子阅读（BMBCode 渲染/交易/投票/管理工具）
│   │   ├── post/              # 发帖/回复/编辑
│   │   ├── usercp/            # 控制面板（资料/头像/密码/联系人）
│   │   ├── messenger/         # 短消息
│   │   ├── admin/             # 后台管理
│   │   ├── forumlogs/[fid]/   # 版主前台日志
│   │   └── api/               # 37 个 API 路由（认证/交易/管理/上传…）
│   ├── components/
│   │   ├── bmf/               # 论坛业务组件（编辑器/工具栏/管理面板…）
│   │   └── ui/                # shadcn/ui 基础组件
│   └── lib/
│       ├── bmbcode.ts         # BMBCode 渲染引擎
│       ├── rich-text.ts       # 富文本 ↔ BMBCode 转换
│       ├── auth.ts            # 会话认证（cookie 按 http/https 动态切换）
│       ├── queries.ts         # 业务查询
│       ├── db.ts              # PG 连接池
│       └── format.ts          # 东八区时间格式化
```

## BMBCode 示例

```
[b]加粗[/b] [i]斜体[/i] [s:1] 表情
[quote]引用[/quote] [code]代码[/code]
[glow=2,#3083be]发光文字[/glow]
[sell=10]出售的内容[/sell]        ← 购买后可见
[post]回复后可见的内容[/post]
[hpost=50]发帖数达到 50 可见[/hpost]
```

## 开发规范

- 仅使用 pnpm 管理依赖
- TypeScript strict：禁用隐式 `any` 与 `as any`
- 时间渲染一律走 `src/lib/format.ts`（东八区），禁止组件内直接 `new Date()` 格式化
- 首帖判定 = 该主题下 `min(posts.id)`
- 提交前运行 `pnpm validate`（tsc + eslint + stylelint）

## License

本项目基于原版 BMForum 7 的功能与视觉进行的学习性复刻，未使用原版代码。仅供学习研究，请勿用于商业用途；如需商用请自行联系原版权所有者获得授权。
