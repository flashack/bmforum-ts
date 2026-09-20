// 执行增量迁移 db/migrate2.sql（幂等）
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://postgres:bmf7pass@localhost:5432/bmf7",
});

const sql = fs.readFileSync(path.join(process.cwd(), "db", "migrate2.sql"), "utf8");
await pool.query(sql);
console.log("Migration migrate2.sql applied.");
await pool.end();
