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
		const parsed = parseInt(projectIdParam, 10);
		if (!isNaN(parsed)) {
			parsedProjectId = parsed;
		}
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

	if (
		!title ||
		typeof title !== 'string' ||
		title.trim().length === 0 ||
		title.trim().length > 256
	) {
		throw error(400, 'Title is required (max 256 chars)');
	}

	if (dueDate !== undefined && dueDate !== null && typeof dueDate !== 'string') {
		throw error(400, 'dueDate must be a string');
	}

	const allowedPriorities = ['none', 'low', 'medium', 'urgent'];
	const resolvedPriority = priority || 'none';
	if (!allowedPriorities.includes(resolvedPriority)) {
		throw error(400, `priority must be one of: ${allowedPriorities.join(', ')}`);
	}

	let parsedProjectId: number | null = null;
	if (projectId != null) {
		parsedProjectId = parseInt(projectId as string, 10);
		if (isNaN(parsedProjectId)) {
			throw error(400, 'projectId must be a valid number');
		}
	}

	const inserted = await db
		.insert(tasks)
		.values({
			title: title.trim(),
			description:
				description && typeof description === 'string' && description.length ? description : null,
			dueDate: dueDate || null,
			projectId: parsedProjectId,
			priority: resolvedPriority
		})
		.returning();

	return json(inserted[0], { status: 201 });
};

export const PUT: RequestHandler = async (event) => {
	const body = await event.request.json();
	const { id, title, description, completed, dueDate, projectId, priority } = body;

	if (typeof id !== 'number' || !Number.isFinite(id)) throw error(400, 'Task ID required');

	if (title !== undefined) {
		if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 256) {
			throw error(400, 'Title must be a non-empty string (max 256 chars)');
		}
	}

	if (description !== undefined && typeof description !== 'string') {
		throw error(400, 'Description must be a string');
	}

	if (completed !== undefined && typeof completed !== 'boolean') {
		throw error(400, 'Completed must be a boolean');
	}

	let parsedProjectId: number | null = null;
	if (projectId != null) {
		parsedProjectId = parseInt(projectId as string, 10);
		if (isNaN(parsedProjectId)) {
			throw error(400, 'projectId must be a valid number');
		}
	}

	const allowedPriorities = ['none', 'low', 'medium', 'urgent'];
	const resolvedPriority = priority ?? undefined;
	if (resolvedPriority !== undefined && !allowedPriorities.includes(resolvedPriority)) {
		throw error(400, `priority must be one of: ${allowedPriorities.join(', ')}`);
	}

	if (dueDate !== undefined && dueDate !== null && typeof dueDate !== 'string') {
		throw error(400, 'dueDate must be a string');
	}

	const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
	if (title !== undefined) updates.title = (title as string).trim();
	if (description !== undefined) updates.description = description;
	if (completed !== undefined) updates.completed = completed;
	if (dueDate !== undefined) updates.dueDate = dueDate || null;
	if (projectId !== undefined) updates.projectId = parsedProjectId;
	if (resolvedPriority !== undefined) updates.priority = resolvedPriority;

	const updated = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();

	if (!updated.length) throw error(404, 'Task not found');
	return json(updated[0]);
};

export const DELETE: RequestHandler = async (event) => {
	const body = await event.request.json();
	const { id } = body;

	if (typeof id !== 'number' || !Number.isFinite(id)) throw error(400, 'Task ID required');

	const deleted = await db.delete(tasks).where(eq(tasks.id, id)).returning();
	if (!deleted.length) throw error(404, 'Task not found');

	return json({ success: true });
};
