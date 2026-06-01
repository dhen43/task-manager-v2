import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/index';
import { projects, tasks } from '$lib/server/db/schema';
import { eq, and, count } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	const results = await db
		.select({
			id: projects.id,
			title: projects.title,
			description: projects.description,
			archived: projects.archived,
			createdAt: projects.createdAt,
			updatedAt: projects.updatedAt,
			taskCount: count(tasks.id)
		})
		.from(projects)
		.leftJoin(tasks, and(eq(tasks.projectId, projects.id), eq(tasks.completed, false)))
		.where(eq(projects.archived, false))
		.groupBy(projects.id);

	return json(results);
};

export const POST: RequestHandler = async (event) => {
	const body = await event.request.json();
	const { title, description } = body;

	if (
		!title ||
		typeof title !== 'string' ||
		title.trim().length === 0 ||
		title.trim().length > 128
	) {
		throw error(400, 'Title is required (max 128 chars)');
	}

	if (description !== undefined && description !== null && typeof description !== 'string') {
		throw error(400, 'Description must be a string');
	}

	const inserted = await db
		.insert(projects)
		.values({
			title: title.trim(),
			description:
				description && typeof description === 'string' && description.length ? description : null
		})
		.returning();

	return json(inserted[0], { status: 201 });
};

export const PUT: RequestHandler = async (event) => {
	const body = await event.request.json();
	const { id, title, description, archived } = body;

	if (typeof id !== 'number' || !Number.isFinite(id)) throw error(400, 'Project ID required');

	if (title !== undefined) {
		if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 128) {
			throw error(400, 'Title must be a non-empty string (max 128 chars)');
		}
	}

	if (description !== undefined && description !== null && typeof description !== 'string') {
		throw error(400, 'Description must be a string');
	}

	if (archived !== undefined && typeof archived !== 'boolean') {
		throw error(400, 'Archived must be a boolean');
	}

	const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
	if (title !== undefined) updates.title = (title as string).trim();
	if (description !== undefined)
		updates.description =
			description && typeof description === 'string' && description.length ? description : null;
	if (archived !== undefined) updates.archived = archived;

	const updated = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();

	if (!updated.length) throw error(404, 'Project not found');
	return json(updated[0]);
};

export const DELETE: RequestHandler = async (event) => {
	const body = await event.request.json();
	const { id, action } = body;

	if (typeof id !== 'number' || !Number.isFinite(id)) throw error(400, 'Project ID required');

	const existing = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, id));
	if (!existing.length) throw error(404, 'Project not found');

	if (action === 'archive') {
		await db
			.update(projects)
			.set({ archived: true, updatedAt: new Date().toISOString() })
			.where(eq(projects.id, id));
	} else if (action === 'deleteAndOrphan') {
		await db.update(tasks).set({ projectId: null }).where(eq(tasks.projectId, id));
		await db.delete(projects).where(eq(projects.id, id));
	} else {
		await db.delete(tasks).where(eq(tasks.projectId, id));
		await db.delete(projects).where(eq(projects.id, id));
	}

	return json({ success: true });
};
