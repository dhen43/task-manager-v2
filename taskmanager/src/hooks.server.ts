import { auth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { autoMigrate, seedSettings } from '$lib/server/db';

let initialized = false;

async function ensureInitialized() {
	if (initialized) return;
	try {
		autoMigrate();
		seedSettings();
	} catch {
		// DB might not need migration
	}
	initialized = true;
}

export const handle: Handle = async ({ event, resolve }) => {
	await ensureInitialized();

	const sessionId = event.cookies.get(auth.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSession(sessionId);
	if (session && session.fresh) {
		const cookie = auth.createSessionCookie(session.id);
		event.cookies.set(cookie.name, cookie.value ?? '', {
			path: cookie.attributes.path ?? '/',
			httpOnly: cookie.attributes.httpOnly,
			secure: cookie.attributes.secure,
			sameSite: cookie.attributes.sameSite,
			maxAge: cookie.attributes.maxAge
		});
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};
