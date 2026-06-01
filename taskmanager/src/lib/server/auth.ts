import { Lucia } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import { Argon2id } from 'oslo/password';
import { eq } from 'drizzle-orm';
import { db, sqlite } from '$lib/server/db';
import { users } from '$lib/server/db/schema';

const adapter = new BetterSqlite3Adapter(sqlite, {
	user: 'users',
	session: 'sessions'
});

export const auth = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: import.meta.env.PROD
		}
	},
	getUserAttributes: (data: any) => ({
		email: data.email
	})
});

export type Auth = typeof auth;

const hasher = new Argon2id();

export async function createUser(email: string, password: string) {
	const passwordHash = await hasher.hash(password);
	const result = await db
		.insert(users)
		.values({
			email,
			passwordHash
		})
		.returning();
	return result[0];
}

export async function validatePassword(email: string, password: string) {
	const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

	if (!existingUser.length) return null;
	const valid = await hasher.verify(existingUser[0].passwordHash, password);
	if (!valid) return null;
	return existingUser[0];
}

export async function changePassword(userId: number, newPassword: string) {
	const passwordHash = await hasher.hash(newPassword);
	await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}
