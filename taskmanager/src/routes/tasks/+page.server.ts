import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { tasks, projects, settings } from '$lib/server/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const userSettings = await db.select().from(settings).limit(1);

	const allTasks = await db
		.select({
			id: tasks.id,
			title: tasks.title,
			description: tasks.description,
			completed: tasks.completed,
			dueDate: tasks.dueDate,
			projectId: tasks.projectId,
			priority: tasks.priority,
			createdAt: tasks.createdAt,
			projectName: projects.title
		})
		.from(tasks)
		.leftJoin(projects, eq(tasks.projectId, projects.id))
		.where(and(eq(tasks.completed, false)))
		.orderBy(desc(tasks.priority), asc(tasks.dueDate), asc(tasks.createdAt));

	const grouped: Record<string, typeof allTasks> = {};
	for (const task of allTasks) {
		const groupName = task.projectName || 'Unassigned';
		if (!grouped[groupName]) grouped[groupName] = [];
		grouped[groupName].push(task);
	}

	const allProjects = await db.select().from(projects).where(eq(projects.archived, false));

	return {
		grouped,
		totalTasks: allTasks.length,
		totalGroups: Object.keys(grouped).length,
		projects: allProjects,
		settings: userSettings[0] || null,
		user: event.locals.user
	};
};
