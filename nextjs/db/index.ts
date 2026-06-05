import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import * as schema from "./schema";

const dbPath = join(process.cwd(), "local.db");
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    title text NOT NULL,
    completed integer DEFAULT false NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    deleted_at integer
  );
`);

export const db = drizzle(sqlite, { schema });
