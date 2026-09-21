#!/usr/bin/env node
/**
 * 生产数据库引导（幂等）。
 *
 * 优先级：
 *  1) 平台注入的 PGDATABASE_URL（Supabase 托管 PG）或 DATABASE_URL 指向远程托管库且可连接
 *     → 直接使用（空库时建表灌种子，数据跨部署持久化）
 *  2) 否则启动本机嵌入式 PostgreSQL（npm 分发的 PG 二进制，无外部依赖）：
 *     - 首次启动：initdb 初始化数据目录 → pg_ctl 启动 → 建角色/库 → 空库时灌入 db/seed.sql
 *     - 再次启动：检测端口与数据目录，自动跳过已完成步骤
 *     - root 环境自动创建非特权用户 bmfpg 并降权执行（PostgreSQL 拒绝以 root 运行）
 *     - 数据目录默认 /tmp/bmf7-pgdata（容器重建后自动重新初始化）
 *     - 若 DATABASE_URL 指向本机实例，则自动适配其角色/数据库契约
 *
 * 注意：部署容器可能注入强制 SSL 的 PG 环境变量（PGSSLMODE/PGREQUIRESSL），
 * 本机嵌入式实例未启用 SSL，因此本机连接一律显式 ssl:false，子进程环境变量一并消毒。
 */
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import pg from 'pg';

const pexec = promisify(execFile);
const require = createRequire(import.meta.url);

const PORT = Number(process.env.BMF_PG_PORT || 5432);
const DATA_DIR = process.env.BMF_PGDATA || '/tmp/bmf7-pgdata';
const LOG_FILE = path.join(os.tmpdir(), 'bmf7-pg.log');
const DB_NAME = 'bmf7';
const DB_USER = 'postgres';
const DB_PASS = 'bmf7pass';
const CLIENT_OPTS = {
  port: PORT,
  user: DB_USER,
  password: DB_PASS,
  connectionTimeoutMillis: 2000,
  ssl: false, // 本机嵌入式实例未启用 SSL，显式关闭以免疫环境变量（PGSSLMODE 等）
};

/** 定位平台二进制目录（pnpm 下依赖未提升到根 node_modules，需从 embedded-postgres 入口向上解析） */
function nativeDir() {
  const epEntry = require.resolve('embedded-postgres');
  let dir = path.dirname(epEntry);
  while (path.basename(dir) !== 'node_modules' && dir !== path.parse(dir).root) {
    dir = path.dirname(dir);
  }
  const platformDir = path.join(dir, '@embedded-postgres', 'linux-x64');
  if (!fs.existsSync(platformDir)) {
    throw new Error(`未找到 PostgreSQL 平台二进制包: ${platformDir}`);
  }
  return path.join(platformDir, 'native');
}

/** 连接串是否指向本机 */
function isLocalHost(host) {
  const h = (host || '').replace(/^\[|\]$/g, '');
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

/** 依次尝试 TCP 与 Unix socket 连接（socket 不走 SSL 握手，最可靠的就绪探针） */
async function connectAny(database = 'postgres', user = DB_USER, pass = DB_PASS) {
  for (const host of ['127.0.0.1', os.tmpdir()]) {
    const client = new pg.Client({ ...CLIENT_OPTS, host, database, user, password: pass });
    try {
      await client.connect();
      return client;
    } catch (err) {
      try {
        await client.end();
      } catch {
        /* ignore */
      }
      if (host === os.tmpdir()) throw err;
    }
  }
  return null;
}

async function isUp(database = 'postgres') {
  try {
    const client = await connectAny(database);
    if (client) {
      await client.end();
      return true;
    }
  } catch {
    /* not ready */
  }
  return false;
}

/** root 环境解析/创建非特权运行账号；非 root 返回空（直接以当前用户运行） */
async function resolveRunner() {
  if (typeof process.getuid !== 'function' || process.getuid() !== 0) {
    return { uid: undefined, gid: undefined };
  }
  const getIds = async (name) => {
    const uid = Number((await pexec('id', ['-u', name])).stdout.trim());
    const gid = Number((await pexec('id', ['-g', name])).stdout.trim());
    return { uid, gid };
  };
  try {
    return await getIds('bmfpg');
  } catch {
    /* 用户不存在，继续创建 */
  }
  await pexec('useradd', ['-m', '-s', '/bin/bash', 'bmfpg']).catch(() => {});
  try {
    return await getIds('bmfpg');
  } catch {
    /* useradd 不可用，兜底找已有普通用户 */
  }
  const passwd = fs.readFileSync('/etc/passwd', 'utf8');
  for (const line of passwd.split('\n')) {
    const cols = line.split(':');
    const uid = Number(cols[2]);
    if (cols[5] && cols[5].startsWith('/home') && uid >= 1000 && uid < 65534) {
      return { uid, gid: uid };
    }
  }
  throw new Error('root 环境下未找到可用的非特权用户（bmfpg 创建失败）');
}

/** 子进程环境消毒：去除/覆盖任何强制 SSL 的 PG 变量 */
function sanitizedEnv(runner) {
  const env = { ...process.env, LC_ALL: 'C' };
  delete env.PGREQUIRESSL;
  delete env.PGSSLCERT;
  delete env.PGSSLKEY;
  delete env.PGSSLROOTCERT;
  env.PGSSLMODE = 'disable';
  if (runner.uid) env.HOME = '/tmp';
  return env;
}

function runAs(bin, args, runner) {
  return pexec(bin, args, {
    uid: runner.uid,
    gid: runner.gid,
    env: sanitizedEnv(runner),
    timeout: 60000,
  });
}

function tailLog(file, lines = 15) {
  try {
    return fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter(Boolean)
      .slice(-lines)
      .join('\n');
  } catch {
    return '(无日志)';
  }
}

/** 读取 SQL 文件（剥离 psql 元命令行） */
function readSqlFile(relPath) {
  const raw = fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
  return raw
    .split('\n')
    .filter((line) => !line.startsWith('\\'))
    .join('\n');
}

/** 读取种子 SQL（剥离 psql 元命令行） */
function seedSql() {
  return readSqlFile('db/seed.sql');
}

/** 增量迁移文件（幂等：IF NOT EXISTS / ON CONFLICT DO NOTHING），按文件名序执行 */
const MIGRATIONS = ['db/migrate2.sql', 'db/migrate3.sql', 'db/migrate4.sql', 'db/migrate5.sql'];

async function ensureSchema(client, label, targetHost = '') {
  const hostTag = targetHost ? ` @ ${targetHost}` : '';
  const hasTable = await client.query("SELECT to_regclass('public.userlist') AS t");
  if (!hasTable.rows[0].t) {
    console.log(`[bmf7-db] ${label}${hostTag} 空库，执行 db/schema.sql 建表`);
    await client.query(readSqlFile('db/schema.sql'));
    console.log(`[bmf7-db] ${label}${hostTag} 建表完成，灌入种子数据 db/seed.sql`);
    await client.query(seedSql());
    console.log('[bmf7-db] 种子数据完成');
  } else {
    // 有表但业务数据为空（部署环境可能注入仅含结构的库）——补灌种子自愈
    const cnt = await client.query(
      'SELECT (SELECT count(*) FROM userlist) AS users, (SELECT count(*) FROM forumdata) AS forums'
    );
    if (Number(cnt.rows[0].users) === 0 && Number(cnt.rows[0].forums) === 0) {
      console.log(`[bmf7-db] ${label}${hostTag} 有表无数据，补灌种子数据 db/seed.sql`);
      await client.query(seedSql());
      console.log('[bmf7-db] 种子补灌完成');
    } else {
      console.log(`[bmf7-db] ${label}${hostTag} 已初始化，跳过种子数据`);
    }
  }
  // 幂等增量迁移：无论新旧库每次兜底执行（schema.sql 落后于增量时自动补齐列/表）
  for (const m of MIGRATIONS) {
    await client.query(readSqlFile(m));
  }
}

/** 外部库连接串：平台注入的 PGDATABASE_URL（Supabase 托管 PG）优先，其次 DATABASE_URL */
function externalDbUrl() {
  return process.env.PGDATABASE_URL || process.env.DATABASE_URL || '';
}

/** 路径一：外部托管库（PGDATABASE_URL/DATABASE_URL 指向远程）——可连接则直接采用并按需灌种子 */
async function tryExternalDb() {
  const envUrl = externalDbUrl();
  if (!envUrl) return false;
  let host = '';
  try {
    host = new URL(envUrl).hostname;
  } catch {
    return false;
  }
  if (isLocalHost(host)) return false; // 本机地址交给嵌入式实例处理

  try {
    const client = new pg.Client({ connectionString: envUrl, connectionTimeoutMillis: 5000 });
    await client.connect();
    const extHost = new URL(envUrl).host;
    console.log(`[bmf7-db] 外部数据库连接串可用，采用外部数据库（数据持久化）@ ${extHost}`);
    await ensureSchema(client, '外部数据库', extHost);
    // 全站统一东八区：外部库也持久化时区（托管库权限受限时跳过，不影响 format.ts 显式 +8 渲染）
    try {
      const dbName = new URL(envUrl).pathname.replace(/^\//, '') || 'postgres';
      await client.query(`ALTER DATABASE "${dbName}" SET timezone TO 'Asia/Shanghai'`);
      console.log(`[bmf7-db] 外部数据库 ${dbName} 时区已设为 Asia/Shanghai`);
    } catch (tzErr) {
      console.log('[bmf7-db] 外部数据库时区设置跳过（权限受限）:', tzErr?.message || tzErr);
    }
    await client.end();
    return true;
  } catch (err) {
    console.log('[bmf7-db] 外部数据库不可用，回退本机嵌入式实例:', err?.message || err);
    return false;
  }
}

/** 路径二：本机嵌入式 PostgreSQL */
async function bootstrapEmbedded() {
  if (await isUp('postgres')) {
    console.log(`[bmf7-db] 端口 ${PORT} 已有 PostgreSQL 运行，跳过启动`);
  } else {
    const bin = path.join(nativeDir(), 'bin');
    const runner = await resolveRunner();
    if (runner.uid) console.log(`[bmf7-db] root 环境，以 uid=${runner.uid} 运行 PG`);

    // initdb（数据目录不存在 PG_VERSION 视为未初始化）
    if (!fs.existsSync(path.join(DATA_DIR, 'PG_VERSION'))) {
      console.log(`[bmf7-db] initdb 初始化数据目录 ${DATA_DIR}`);
      fs.rmSync(DATA_DIR, { recursive: true, force: true });
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const pwfile = path.join(os.tmpdir(), `bmf7-pwfile-${process.pid}`);
      fs.writeFileSync(pwfile, `${DB_PASS}\n`);
      fs.chmodSync(pwfile, 0o600);
      if (runner.uid) {
        fs.chownSync(DATA_DIR, runner.uid, runner.gid);
        fs.chownSync(pwfile, runner.uid, runner.gid);
      }
      await runAs(
        path.join(bin, 'initdb'),
        ['-D', DATA_DIR, '-U', DB_USER, '-A', 'md5', `--pwfile=${pwfile}`, '-E', 'UTF8', '--locale=C'],
        runner
      );
      fs.rmSync(pwfile, { force: true });
      console.log('[bmf7-db] initdb 完成');
    }

    // pg_ctl 启动
    console.log(`[bmf7-db] pg_ctl 启动 PostgreSQL (127.0.0.1:${PORT})`);
    await runAs(
      path.join(bin, 'pg_ctl'),
      [
        '-D',
        DATA_DIR,
        '-l',
        LOG_FILE,
        '-w',
        '-t',
        '30',
        '-o',
        `-p ${PORT} -h 127.0.0.1 -k ${os.tmpdir()} -c fsync=off -c synchronous_commit=off -c full_page_writes=off`,
        'start',
      ],
      runner
    );

    // 等待就绪（TCP + Unix socket 双通道探测）
    let ready = false;
    for (let i = 0; i < 30; i++) {
      if (await isUp('postgres')) {
        ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!ready) {
      throw new Error(`PostgreSQL 启动超时，PG 日志尾部:\n${tailLog(LOG_FILE)}`);
    }
  }

  // 角色与库：默认 postgres/bmf7pass/bmf7；若 DATABASE_URL 指向本机实例则适配其契约
  const target = { user: DB_USER, pass: DB_PASS, db: DB_NAME };
  const envUrl = process.env.DATABASE_URL;
  if (envUrl) {
    try {
      const u = new URL(envUrl);
      if (isLocalHost(u.hostname) && Number(u.port || 5432) === PORT) {
        const user = decodeURIComponent(u.username || '') || DB_USER;
        const pass = decodeURIComponent(u.password || '') || DB_PASS;
        const db = (u.pathname || '').replace(/^\//, '') || DB_NAME;
        if (user && pass && /^[a-zA-Z_][a-zA-Z0-9_$]*$/.test(db)) {
          target.user = user;
          target.pass = pass;
          target.db = db;
          console.log(`[bmf7-db] DATABASE_URL 指向本机实例，适配角色 ${user} / 库 ${db}`);
        }
      }
    } catch {
      console.log('[bmf7-db] DATABASE_URL 解析失败，使用默认角色/库');
    }
  }

  const sysClient = await connectAny('postgres');
  if (target.user !== DB_USER) {
    const roleExists = await sysClient.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [
      target.user,
    ]);
    const escapedPass = target.pass.replace(/'/g, "''");
    if (roleExists.rowCount === 0) {
      await sysClient.query(
        `CREATE ROLE "${target.user}" LOGIN SUPERUSER PASSWORD '${escapedPass}'`
      );
      console.log(`[bmf7-db] 已创建角色 ${target.user}`);
    } else {
      await sysClient.query(
        `ALTER ROLE "${target.user}" WITH LOGIN SUPERUSER PASSWORD '${escapedPass}'`
      );
    }
  }
  const dbExists = await sysClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [
    target.db,
  ]);
  if (dbExists.rowCount === 0) {
    const owner = target.user !== DB_USER ? ` OWNER "${target.user}"` : '';
    await sysClient.query(`CREATE DATABASE "${target.db}" WITH ENCODING 'UTF8'${owner}`);
    console.log(`[bmf7-db] 已创建数据库 ${target.db}`);
  }
  // 全站统一东八区：持久化数据库时区（initdb 默认取容器时区，通常为 UTC）
  await sysClient.query(`ALTER DATABASE "${target.db}" SET timezone TO 'Asia/Shanghai'`);
  await sysClient.end();

  // 种子数据：优先用目标角色连接，失败回退超级用户
  let client;
  try {
    client = await connectAny(target.db, target.user, target.pass);
  } catch {
    client = await connectAny(target.db);
  }
  await ensureSchema(client, `本机库 ${target.db}`);
  await client.end();

  console.log(`[bmf7-db] PostgreSQL 就绪: 127.0.0.1:${PORT}/${target.db}`);
}

async function main() {
  if (process.env.BMF_FORCE_EMBEDDED !== '1' && (await tryExternalDb())) {
    return;
  }
  await bootstrapEmbedded();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[bmf7-db] 引导失败:', err?.message || err);
    process.exit(1);
  });
