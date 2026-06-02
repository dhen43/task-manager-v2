import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async (event) => {
	const { user } = event.locals;

	// Allow /setup to always be accessible (first-run flow)
	if (event.url.pathname === '/setup') {
		return { user: null };
	}

	if (!user) {
		throw redirect(302, '/setup');
	}

	return {
		user
	};
};
