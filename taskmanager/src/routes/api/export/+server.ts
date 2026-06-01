import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { tasks, projects } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
	const allTasks = await db.select().from(tasks);
	const allProjects = await db.select().from(projects);

	return json({
		tasks: allTasks,
		projects: allProjects,
		exportedAt: new Date().toISOString()
	});
};
