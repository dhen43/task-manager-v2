import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { tasks, projects, settings } from '$lib/server/db/schema';
import { eq, and, count } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const userSettings = await db.select().from(settings).limit(1);

	const allProjects = await db.select().from(projects).where(eq(projects.archived, false));

	const projectsWithCounts = await Promise.all(
		allProjects.map(async (project) => {
			const [{ count: taskCount }] = await db
				.select({ count: count(tasks.id) })
				.from(tasks)
				.where(and(eq(tasks.projectId, project.id), eq(tasks.completed, false)));
			return {
				id: project.id,
				title: project.title,
				description: project.description,
				taskCount
			};
		})
	);

	return {
		projects: projectsWithCounts,
		allProjects: allProjects,
		settings: userSettings[0] || null,
		user: event.locals.user
	};
};
