import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

const url = process.env.DATABASE_URL ?? 'local.db';
const sqlite = new Database(url);

sqlite.exec(`
	create table if not exists todos (
		id integer primary key autoincrement,
		title text not null,
		completed integer not null default 0,
		deleted_at integer,
		created_at integer not null default (unixepoch('subsec') * 1000),
		updated_at integer not null default (unixepoch('subsec') * 1000)
	);
`);

export const db = drizzle(sqlite, { schema });
