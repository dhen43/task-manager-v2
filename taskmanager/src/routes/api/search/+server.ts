import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/index';
import { tasks, projects } from '$lib/server/db/schema';
import { like, sql } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	const { searchParams } = event.url;
	const q = searchParams.get('q') || '';

	if (q.length < 2) {
		return json([]);
	}

	const pattern = `%${q}%`;

	const [taskRows, projectRows] = await Promise.all([
		db
			.select({ id: tasks.id, title: tasks.title })
			.from(tasks)
			.where(like(tasks.title, pattern))
			.limit(10).orderBy(sql`CASE ${tasks.priority}
				WHEN 'urgent' THEN 0
				WHEN 'medium' THEN 1
				WHEN 'low' THEN 2
				WHEN 'none' THEN 3
				ELSE 4
			END`),
		db
			.select({ id: projects.id, title: projects.title })
			.from(projects)
			.where(like(projects.title, pattern))
			.limit(10)
			.orderBy(projects.title)
	]);

	const results = [
		...taskRows.map((r) => ({
			id: r.id,
			title: r.title,
			type: 'task',
			href: '#'
		})),
		...projectRows.map((r) => ({
			id: r.id,
			title: r.title,
			type: 'project',
			href: `/projects/${r.id}`
		}))
	];

	return json(results);
};
