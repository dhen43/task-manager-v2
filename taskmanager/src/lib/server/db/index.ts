import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { settings } from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export const sqlite = new Database(env.DATABASE_URL);

export const db = drizzle(sqlite, { schema });

export function autoMigrate() {
	migrate(db, { migrationsFolder: './drizzle' });
}

export function seedSettings() {
	const existing = db.select().from(settings).limit(1).all();
	if (existing.length === 0) {
		db.insert(settings)
			.values({
				id: 1,
				theme: 'system',
				accentColor: '#6366f1',
				shortcutsEnabled: true,
				timezone: 'UTC'
			})
			.run();
	}
}
