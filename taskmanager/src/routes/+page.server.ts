import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { tasks, projects, settings } from '$lib/server/db/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const userSettings = await db.select().from(settings).limit(1);
	const tz = userSettings[0]?.timezone || 'UTC';

	const today = new Date();
	const todayStr = new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	})
		.format(today)
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
				sql`due_date IS NULL OR substr(due_date, 1, 10) <= ${todayStr}`
			)
		)
		.orderBy(desc(tasks.priority), asc(tasks.dueDate), asc(tasks.createdAt));

	const overdueCount = allTasks.filter(
		(t) => t.dueDate && t.dueDate.substring(0, 10) < todayStr
	).length;

	const completedTasks = await db
		.select({
			id: tasks.id,
			title: tasks.title,
			completed: tasks.completed,
			dueDate: tasks.dueDate,
			projectId: tasks.projectId,
			priority: tasks.priority,
			projectName: projects.title
		})
		.from(tasks)
		.leftJoin(projects, eq(tasks.projectId, projects.id))
		.where(and(eq(tasks.completed, true), sql`date(updated_at) >= date('now', '-7 days')`));

	const allProjects = await db.select().from(projects).where(eq(projects.archived, false));

	return {
		tasks: allTasks,
		completedTasks,
		overdueCount,
		projects: allProjects,
		settings: userSettings[0] || null,
		user: event.locals.user
	};
};
