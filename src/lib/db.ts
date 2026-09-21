import pg from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function pickDbUrl(): string {
  // 平台注入的 Supabase 托管 PG 连接串优先（数据跨部署持久化），其次 DATABASE_URL
  if (process.env.PGDATABASE_URL) return process.env.PGDATABASE_URL;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  // 兜底：读取 .env.local（开发环境）
  try {
    const lines = readFileSync(join(process.cwd(), ".env.local"), "utf-8").split("\n");
    for (const line of lines) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ignore */
  }
  return "postgres://postgres:bmf7pass@localhost:5432/bmf7";
}

declare global {
  // eslint-disable-next-line no-var
  var __bmfPool: pg.Pool | undefined;
  // eslint-disable-next-line no-var
  var __bmfPoolUrl: string | undefined;
}

/** 连接串是否指向本机（生产为嵌入式 PG 实例，未启用 SSL） */
function isLocalDbUrl(url: string): boolean {
  return /@(localhost|127\.0\.0\.1|\[::1\]):/i.test(url);
}

/**
 * 本机连接串剥除 SSL 相关参数。
 * 关键：pg-connection-string 解析 URL 时 sslmode 会覆盖显式传入的 ssl 配置，
 * 平台注入的 DATABASE_URL 若携带 sslmode=require 会导致
 * "The server does not support SSL connections"（本机嵌入式 PG 未启用 SSL）。
 */
function sanitizeLocalSsl(raw: string): string {
  if (!isLocalDbUrl(raw)) return raw;
  try {
    const u = new URL(raw);
    for (const key of ["sslmode", "ssl", "requiressl", "sslnegotiation"]) {
      u.searchParams.delete(key);
    }
    return u.toString();
  } catch {
    return raw;
  }
}

const dbUrl = sanitizeLocalSsl(pickDbUrl());

export const pool: pg.Pool =
  // 连接串变化时重建连接池（HMR 热更配置后无需重启 dev server）
  globalThis.__bmfPool && globalThis.__bmfPoolUrl === dbUrl
    ? globalThis.__bmfPool
    : new pg.Pool({
    connectionString: dbUrl,
    // 本机连接显式关闭 SSL（免疫部署容器的 PGSSLMODE/PGREQUIRESSL 环境变量）；
    // 远程库保留默认（可用 BMF_PG_SSL=1 强制开启并跳过证书校验）。
    ssl: isLocalDbUrl(dbUrl)
      ? false
      : process.env.BMF_PG_SSL === "1"
        ? { rejectUnauthorized: false }
        : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__bmfPool = pool;
  globalThis.__bmfPoolUrl = dbUrl;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await pool.query<T>(sql, params);
  return res.rows;
}

export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<pg.QueryResult> {
  return pool.query(sql, params);
}

/** 事务：回调内使用 client 查询，异常自动回滚 */
export async function transaction<T>(
  fn: (client: { query: <T2 extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, params?: unknown[]) => Promise<pg.QueryResult<T2>> }) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn({
      query: async <T2 extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, params: unknown[] = []) => {
        return client.query<T2>(sql, params as unknown[]);
      },
    });
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
