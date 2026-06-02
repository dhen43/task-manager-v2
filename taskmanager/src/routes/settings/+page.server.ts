import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { settings, projects } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const [settingsRows, projectRows] = await Promise.all([
		db.select().from(settings).limit(1),
		db.select().from(projects).where(eq(projects.archived, false))
	]);

	const settingsRow = settingsRows[0] ?? {
		id: 1,
		theme: 'system',
		accentColor: '#6366f1',
		shortcutsEnabled: true,
		timezone: 'UTC'
	};

	const projectNavItems = projectRows.map((p) => ({
		label: p.title,
		href: `/projects/${p.id}`,
		count: 0
	}));

	return {
		settings: settingsRow,
		projectNavItems
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { user } = event.locals;
		if (!user) {
			throw redirect(302, '/setup');
		}

		const formData = await event.request.formData();
		const theme = formData.get('theme') as string;
		const accentColor = formData.get('accentColor') as string;
		const shortcutsEnabled = formData.get('shortcutsEnabled') === 'on';
		const timezone = formData.get('timezone') as string;

		const validThemes = ['system', 'light', 'dark'];
		if (!validThemes.includes(theme)) {
			return fail(400, { error: 'Invalid theme', theme, accentColor, shortcutsEnabled, timezone });
		}

		if (!timezone || timezone.length < 1) {
			return fail(400, {
				error: 'Timezone is required',
				theme,
				accentColor,
				shortcutsEnabled,
				timezone
			});
		}

		await db
			.update(settings)
			.set({
				theme,
				accentColor: accentColor || '#6366f1',
				shortcutsEnabled,
				timezone
			})
			.where(eq(settings.id, 1));

		return { success: true };
	}
};
