import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { tasks, projects, settings } from '$lib/server/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	const id = parseInt(event.params.id);
	if (isNaN(id)) throw error(404, 'Project not found');

	const [projectRow] = await db
		.select()
		.from(projects)
		.where(and(eq(projects.id, id), eq(projects.archived, false)));

	if (!projectRow) throw error(404, 'Project not found');

	const projectTasks = await db
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
		.where(eq(tasks.projectId, id))
		.orderBy(desc(tasks.priority), asc(tasks.dueDate), asc(tasks.createdAt));

	const incompleteTasks = projectTasks.filter((t) => !t.completed);
	const completedTasks = projectTasks.filter((t) => t.completed);

	const allProjects = await db.select().from(projects).where(eq(projects.archived, false));
	const userSettings = await db.select().from(settings).limit(1);

	return {
		project: projectRow,
		tasks: incompleteTasks,
		completedTasks,
		projects: allProjects,
		settings: userSettings[0] || null,
		user: event.locals.user
	};
};
