/**
 * 数据库初始化脚本：执行 schema.sql 与 seed.sql，并重置用户密码（scrypt）
 * 用法：node scripts/db-init.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, scryptSync } from "node:crypto";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function pickDbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const lines = [];
  for (const f of [".env.local", ".env"]) {
    try {
      lines.push(...readFileSync(join(root, f), "utf-8").split("\n"));
    } catch {
      /* ignore */
    }
  }
  for (const line of lines) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  return "postgres://postgres:bmf7pass@localhost:5432/bmf7";
}

const url = pickDbUrl();
console.log("Connecting:", url.replace(/:[^:@/]+@/, ":****@"));
const pool = new pg.Pool({ connectionString: url });

async function runFile(file) {
  const sql = readFileSync(join(root, file), "utf-8");
  await pool.query(sql);
  console.log(`OK: ${file}`);
}

function hashPassword(password, salt) {
  return scryptSync(password, salt, 32).toString("hex");
}

async function main() {
  await runFile("db/schema.sql");
  await runFile("db/seed.sql");

  // 重置种子用户密码
  const { rows: users } = await pool.query("SELECT userid FROM userlist");
  for (const u of users) {
    const salt = randomBytes(8).toString("hex");
    const pwd = hashPassword("password123", salt);
    await pool.query("UPDATE userlist SET pwd = $1, salt = $2 WHERE userid = $3", [pwd, salt, u.userid]);
  }
  console.log(`OK: reset ${users.length} seed passwords -> password123`);

  // 同步 SERIAL 序列到种子数据的最大 id（种子显式指定 id 会导致序列滞后）
  const seqColumns = {
    forumdata: "id",
    userlist: "userid",
    threads: "tid",
    posts: "id",
    tags: "tagid",
    primsg: "id",
    announces: "id",
  };
  for (const [table, col] of Object.entries(seqColumns)) {
    await pool.query(
      `SELECT setval(pg_get_serial_sequence('${table}', '${col}'),
              COALESCE((SELECT MAX(${col}) FROM ${table}), 0) + 1, false)`
    );
  }
  console.log("OK: serial sequences synced");

  // 校验
  const { rows: stats } = await pool.query(
    "SELECT (SELECT count(*) FROM forumdata) AS forums, (SELECT count(*) FROM threads) AS threads, (SELECT count(*) FROM userlist) AS users"
  );
  console.log("Stats:", stats[0]);
  await pool.end();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});

