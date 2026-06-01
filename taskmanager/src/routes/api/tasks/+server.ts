import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/index';
import { tasks } from '$lib/server/db/schema';
import { eq, and, isNull, sql, gte, lte, asc, or } from 'drizzle-orm';
import { startOfDay, endOfDay, addDays } from 'date-fns';

export const GET: RequestHandler = async (event) => {
	const { searchParams } = event.url;
	const view = searchParams.get('view') || 'today';

	let whereClause: import('drizzle-orm').SQL | undefined;

	switch (view) {
		case 'today': {
			const todayStart = startOfDay(new Date()).toISOString();
			const todayEnd = endOfDay(new Date()).toISOString();
			whereClause = and(
				eq(tasks.completed, false),
				or(
					and(gte(tasks.dueDate, todayStart), lte(tasks.dueDate, todayEnd)),
					lte(tasks.dueDate, todayStart),
					isNull(tasks.dueDate)
				)
			);
			break;
		}
		case 'upcoming': {
			const tomorrow = startOfDay(addDays(new Date(), 1)).toISOString();
			whereClause = and(eq(tasks.completed, false), gte(tasks.dueDate, tomorrow));
			break;
		}
		case 'inbox':
			whereClause = and(eq(tasks.completed, false), isNull(tasks.projectId));
			break;
		case 'all':
			whereClause = undefined;
			break;
		default:
			throw error(400, `Unknown view: ${view}`);
	}

	const projectIdParam = searchParams.get('projectId');
	let parsedProjectId: number | undefined;
	if (projectIdParam !== null) {
		parsedProjectId = parseInt(projectIdParam, 10);
	}

	const finalWhereClause =
		parsedProjectId !== undefined
			? whereClause
				? and(whereClause, eq(tasks.projectId, parsedProjectId))
				: eq(tasks.projectId, parsedProjectId)
			: whereClause;

	const queryBuilder = db.select().from(tasks);

	const filteredBuilder = finalWhereClause ? queryBuilder.where(finalWhereClause) : queryBuilder;

	const rows = await filteredBuilder.orderBy(
		sql`CASE ${tasks.priority}
			WHEN 'urgent' THEN 0
			WHEN 'medium' THEN 1
			WHEN 'low' THEN 2
			WHEN 'none' THEN 3
			ELSE 4
		END`,
		asc(tasks.dueDate),
		asc(tasks.createdAt)
	);

	return json(rows);
};

export const POST: RequestHandler = async (event) => {
	const body = await event.request.json();
	const { title, description, dueDate, projectId, priority } = body;

	if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 256) {
		throw error(400, 'Title is required (max 256 chars)');
	}

	const inserted = await db
		.insert(tasks)
		.values({
			title: title.trim(),
			description:
				description && typeof description === 'string' && description.length ? description : null,
			dueDate: dueDate || null,
			projectId: projectId ? parseInt(projectId as string, 10) : null,
			priority: priority || 'none'
		})
		.returning();

	return json(inserted[0], { status: 201 });
};

export const PUT: RequestHandler = async (event) => {
	const body = await event.request.json();
	const { id, ...updates } = body;

	if (!id) throw error(400, 'Task ID required');

	// Sanitize projectId if provided
	if ('projectId' in updates && updates.projectId != null) {
		updates.projectId = parseInt(updates.projectId as string, 10);
	}

	const updated = await db
		.update(tasks)
		.set({ ...updates, updatedAt: new Date().toISOString() })
		.where(eq(tasks.id, id))
		.returning();

	if (!updated.length) throw error(404, 'Task not found');
	return json(updated[0]);
};

export const DELETE: RequestHandler = async (event) => {
	const body = await event.request.json();
	const { id } = body;

	if (!id) throw error(400, 'Task ID required');

	const deleted = await db.delete(tasks).where(eq(tasks.id, id)).returning();
	if (!deleted.length) throw error(404, 'Task not found');

	return json({ success: true });
};
