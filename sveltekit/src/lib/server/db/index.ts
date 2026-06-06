import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { DATABASE_URL } from '$env/static/private';

import * as schema from './schema';

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is required');
}

const sqlite = new Database(DATABASE_URL);

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
