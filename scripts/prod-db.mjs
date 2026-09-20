#!/usr/bin/env node
/**
 * 生产环境嵌入式 PostgreSQL 引导（幂等）。
 *
 * 部署容器内没有外部数据库服务，使用随 npm 分发的 PostgreSQL 二进制
 * （embedded-postgres 的 @embedded-postgres/linux-x64 平台包）在本机启动实例：
 *   - 首次启动：initdb 初始化数据目录 → pg_ctl 启动 → 空库时灌入 db/seed.sql
 *   - 再次启动：检测端口与数据目录，自动跳过已完成步骤
 *   - root 环境自动创建非特权用户 bmfpg 并降权执行（PostgreSQL 拒绝以 root 运行）
 *   - 数据目录默认 /tmp/bmf7-pgdata（生产环境唯一可写目录，容器重建后自动重新初始化）
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
  host: '127.0.0.1',
  port: PORT,
  user: DB_USER,
  password: DB_PASS,
  connectionTimeoutMillis: 2000,
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

async function canConnect(database = 'postgres') {
  const client = new pg.Client({ ...CLIENT_OPTS, database });
  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
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

function runAs(bin, args, runner) {
  return pexec(bin, args, {
    uid: runner.uid,
    gid: runner.gid,
    env: { ...process.env, LC_ALL: 'C', HOME: runner.uid ? '/tmp' : process.env.HOME },
    timeout: 60000,
  });
}

async function main() {
  if (await canConnect('postgres')) {
    console.log(`[bmf7-db] 127.0.0.1:${PORT} 已有 PostgreSQL 运行，跳过引导`);
    return;
  }

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

  // pg_ctl 启动（已监听则跳过）
  if (!(await canConnect('postgres'))) {
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
  }

  // 等待就绪
  let ready = false;
  for (let i = 0; i < 30; i++) {
    if (await canConnect('postgres')) {
      ready = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ready) throw new Error(`PostgreSQL 启动超时，请查看日志 ${LOG_FILE}`);

  // 建库（已存在则忽略）
  const sysClient = new pg.Client({ ...CLIENT_OPTS, database: 'postgres' });
  await sysClient.connect();
  const dbExists = await sysClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
  if (dbExists.rowCount === 0) {
    await sysClient.query(`CREATE DATABASE ${DB_NAME} WITH ENCODING 'UTF8'`);
    console.log(`[bmf7-db] 已创建数据库 ${DB_NAME}`);
  }
  await sysClient.end();

  // 种子数据（幂等：存在 userlist 表即认为已初始化）
  const client = new pg.Client({ ...CLIENT_OPTS, database: DB_NAME });
  await client.connect();
  const hasTable = await client.query("SELECT to_regclass('public.userlist') AS t");
  if (!hasTable.rows[0].t) {
    console.log('[bmf7-db] 空库，灌入种子数据 db/seed.sql');
    const seedPath = path.resolve(process.cwd(), 'db/seed.sql');
    const raw = fs.readFileSync(seedPath, 'utf8');
    // 剥离 psql 元命令行（\restrict 等），仅保留纯 SQL 供简单查询协议执行
    const sql = raw
      .split('\n')
      .filter((line) => !line.startsWith('\\'))
      .join('\n');
    await client.query(sql);
    console.log('[bmf7-db] 种子数据完成');
  } else {
    console.log('[bmf7-db] 数据库已初始化，跳过种子数据');
  }
  await client.end();

  console.log(`[bmf7-db] PostgreSQL 就绪: 127.0.0.1:${PORT}/${DB_NAME}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[bmf7-db] 引导失败:', err?.message || err);
    process.exit(1);
  });
