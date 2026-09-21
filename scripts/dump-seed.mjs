/**
 * 导出种子数据 db/seed.sql（node pg 实现，替代系统 pg_dump——沙箱环境不含该二进制）。
 * 用法：node scripts/dump-seed.mjs [DATABASE_URL]
 * 生成内容：public 全部表的 INSERT 语句 + 序列 setval。
 */
import pg from "pg";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const url =
  process.argv[2] ||
  process.env.DATABASE_URL ||
  "postgres://postgres:bmf7pass@127.0.0.1:5432/bmf7";
const OUT = join(process.cwd(), "db", "seed.sql");

const pool = new pg.Pool({
  connectionString: url,
  ssl: /@(localhost|127\.0\.0\.1|\[::1\]):/i.test(url) ? false : undefined,
});

/** 列值 → SQL 字面量 */
function literal(val, dataType) {
  if (val === null || val === undefined) return "NULL";
  switch (dataType) {
    case "integer":
    case "smallint":
    case "bigint":
    case "numeric":
    case "real":
    case "double precision":
      return String(val);
    case "boolean":
      return val === true ? "true" : "false";
    case "bytea":
      // hex 格式要求纯十六进制字符串（\x 转义是 escape 格式，会解析失败）
      return `decode('${Buffer.from(val).toString("hex")}','hex')`;
    case "jsonb":
    case "json":
      return `'${JSON.stringify(val).replace(/'/g, "''")}'::${dataType === "jsonb" ? "jsonb" : "json"}`;
    case "ARRAY":
      return "NULL"; // 当前 schema 未使用数组列
    default:
      // text / varchar / char / date / timestamp 等
      return `'${String(val).replace(/'/g, "''")}'`;
  }
}

try {
  const tablesRes = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' AND table_type='BASE TABLE'
     ORDER BY table_name`
  );
  const tables = tablesRes.rows.map((r) => r.table_name);

  const lines = [
    "-- BMForum 7 复刻 · 种子数据（由 scripts/dump-seed.mjs 导出）",
    "-- 恢复方式：psql -f db/seed.sql 或由 scripts/prod-db.mjs 在空库时自动灌入",
    "BEGIN;",
    "",
  ];

  let totalRows = 0;
  for (const table of tables) {
    const colsRes = await pool.query(
      `SELECT column_name, data_type, ordinal_position
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1
       ORDER BY ordinal_position`,
      [table]
    );
    const cols = colsRes.rows;
    const colList = cols.map((c) => `"${c.column_name}"`).join(", ");

    const dataRes = await pool.query(`SELECT * FROM "${table}"`);
    for (const row of dataRes.rows) {
      const vals = cols.map((c) => literal(row[c.column_name], c.data_type)).join(", ");
      lines.push(`INSERT INTO public."${table}" (${colList}) VALUES (${vals});`);
      totalRows++;
    }
    if (dataRes.rows.length > 0) lines.push("");
  }

  // 序列恢复：取所有 identity/sequence 的当前值
  const seqRes = await pool.query(
    `SELECT sequencename, last_value FROM pg_sequences WHERE schemaname='public' AND last_value IS NOT NULL`
  );
  for (const s of seqRes.rows) {
    lines.push(
      `SELECT setval(pg_get_serial_sequence('"${s.sequencename}"','${s.sequencename}'), ${s.last_value}, true);`
    );
  }
  // 上面按序列名拼列名可能不准，改用标准方式：遍历有 serial 默认值的列
  lines.length = lines.length - seqRes.rowCount; // 撤销简易写法
  const seqColRes = await pool.query(
    `SELECT table_name, column_name, pg_get_serial_sequence('"' || table_name || '"', column_name) AS seq
     FROM information_schema.columns
     WHERE table_schema='public' AND column_default LIKE 'nextval%'
     ORDER BY table_name`
  );
  const doneSeq = new Set();
  for (const s of seqColRes.rows) {
    if (!s.seq || doneSeq.has(s.seq)) continue;
    doneSeq.add(s.seq);
    const v = await pool.query(`SELECT last_value, is_called FROM ${s.seq}`);
    const { last_value, is_called } = v.rows[0];
    if (last_value === null) continue;
    lines.push(
      `SELECT setval('${s.seq}', ${last_value}, ${is_called === true ? "true" : "false"});`
    );
  }

  lines.push("", "COMMIT;", "");
  writeFileSync(OUT, lines.join("\n"), "utf-8");
  console.log(`[dump-seed] ${tables.length} tables, ${totalRows} rows -> ${OUT}`);
} finally {
  await pool.end();
}
