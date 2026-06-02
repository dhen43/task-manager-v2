<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
	<form
		action="?/setup"
		method="POST"
		class="w-full max-w-md rounded-lg bg-white p-8 shadow dark:bg-gray-800"
	>
		<h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Welcome to Task Manager</h1>
		{#if form?.error}
			<p class="mb-4 text-red-500">{form.error}</p>
		{/if}
		<div class="mb-4">
			<label for="email" class="mb-1 block text-sm font-medium">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				value={form?.email || ''}
				required
				class="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
			/>
		</div>
		<div class="mb-6">
			<label for="password" class="mb-1 block text-sm font-medium">Password</label>
			<input
				id="password"
				name="password"
				type="password"
				minlength="8"
				required
				class="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
			/>
		</div>
		<button
			type="submit"
			class="w-full rounded bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"
		>
			Get Started
		</button>
	</form>
</div>
