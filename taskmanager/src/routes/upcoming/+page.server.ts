import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { tasks, projects, settings } from '$lib/server/db/schema';
import { eq, and, sql, asc } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const userSettings = await db.select().from(settings).limit(1);
	const tz = userSettings[0]?.timezone || 'UTC';

	const now = new Date();
	const todayStr = new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	})
		.format(now)
		.replace(/\//g, '-');

	const weekLater = new Date(now.getTime() + 7 * 86400000);
	const weekLaterStr = new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	})
		.format(weekLater)
		.replace(/\//g, '-');

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
		.where(
			and(
				eq(tasks.completed, false),
				sql`due_date IS NOT NULL`,
				sql`substr(due_date, 1, 10) > ${todayStr}`,
				sql`substr(due_date, 1, 10) <= ${weekLaterStr}`
			)
		)
		.orderBy(asc(tasks.dueDate), asc(tasks.createdAt));

	const grouped: Record<string, typeof allTasks> = {};
	for (const task of allTasks) {
		const dateKey = task.dueDate ? task.dueDate.substring(0, 10) : 'No date';
		if (!grouped[dateKey]) grouped[dateKey] = [];
		grouped[dateKey].push(task);
	}

	const allProjects = await db.select().from(projects).where(eq(projects.archived, false));

	return {
		grouped,
		projects: allProjects,
		settings: userSettings[0] || null,
		user: event.locals.user
	};
};
