import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createUser, auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { settings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password || password.length < 8) {
			return fail(400, {
				error: 'Email and password (min 8 chars) required',
				email
			});
		}

		try {
			const user = await createUser(email, password);
			const session = await auth.createSession(String(user.id), {});
			const cookie = auth.createSessionCookie(session.id);
			event.cookies.set(cookie.name, cookie.value ?? '', {
				path: cookie.attributes.path ?? '/',
				httpOnly: cookie.attributes.httpOnly,
				secure: cookie.attributes.secure,
				sameSite: cookie.attributes.sameSite,
				maxAge: cookie.attributes.maxAge
			});

			const tz = event.request.headers.get('x-timezone') || 'UTC';
			await db.update(settings).set({ timezone: tz }).where(eq(settings.id, 1));

			throw redirect(302, '/');
		} catch (err) {
			if (err instanceof Error && err.message.includes('redirect')) throw err;
			return fail(500, {
				error: 'Failed to create user',
				email
			});
		}
	}
};
