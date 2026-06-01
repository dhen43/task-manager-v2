import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';

export const load: LayoutServerLoad = async (event) => {
	const { user } = event.locals;

	if (!user) {
		const count = await db.select({ count: users.id }).from(users);
		if (count.length === 0) {
			throw redirect(302, '/setup');
		}
		throw redirect(302, '/setup');
	}

	return {
		user
	};
};
