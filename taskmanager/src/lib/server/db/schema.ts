import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	description: text('description'),
	completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
	dueDate: text('due_date'),
	projectId: integer('project_id'),
	priority: text('priority', { enum: ['none', 'low', 'medium', 'urgent'] }).default('none'),
	createdAt: text('created_at')
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: text('updated_at')
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull()
});

export const projects = sqliteTable('projects', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	description: text('description'),
	archived: integer('archived', { mode: 'boolean' }).default(false).notNull(),
	createdAt: text('created_at')
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: text('updated_at')
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull()
});

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	expiresAt: integer('expires_at').notNull()
});

export const settings = sqliteTable('settings', {
	id: integer('id').primaryKey(),
	theme: text('theme').default('system'),
	accentColor: text('accent_color').default('#6366f1'),
	shortcutsEnabled: integer('shortcuts_enabled', { mode: 'boolean' }).default(true),
	timezone: text('timezone').default('UTC')
});
