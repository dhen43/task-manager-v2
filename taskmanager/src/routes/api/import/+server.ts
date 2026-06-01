import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { tasks, projects } from '$lib/server/db/schema';

export const POST: RequestHandler = async (event) => {
	const body = await event.request.json();
	const { tasks: importedTasks, projects: importedProjects } = body;

	if (!importedTasks || !importedProjects) {
		throw error(400, 'Invalid export format');
	}

	// Clear existing data then insert
	await db.delete(tasks);
	await db.delete(projects);

	if (importedProjects.length) {
		const projectsToInsert = importedProjects.map((p: any) => ({
			id: p.id,
			title: p.title,
			description: p.description,
			archived: p.archived,
			createdAt: p.createdAt,
			updatedAt: p.updatedAt
		}));
		await db.insert(projects).values(projectsToInsert);
	}

	if (importedTasks.length) {
		const tasksToInsert = importedTasks.map((t: any) => ({
			id: t.id,
			title: t.title,
			description: t.description,
			completed: t.completed,
			dueDate: t.dueDate,
			projectId: t.projectId,
			priority: t.priority,
			createdAt: t.createdAt,
			updatedAt: t.updatedAt
		}));
		await db.insert(tasks).values(tasksToInsert);
	}

	return json({ success: true });
};
