import pg from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function pickDbUrl(): string {
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
}

export const pool: pg.Pool =
  globalThis.__bmfPool ??
  new pg.Pool({
    connectionString: pickDbUrl(),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__bmfPool = pool;
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
