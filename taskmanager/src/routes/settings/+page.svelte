<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import Search from '$lib/components/Search.svelte';
	import type { PageData } from './$types';
	import type { ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const projectNavItems = data.projectNavItems;
</script>

<div class="flex min-h-screen bg-gray-50 dark:bg-gray-900">
	<Sidebar
		{projectNavItems}
		settings={{
			shortcutsEnabled: data.settings.shortcutsEnabled ?? true,
			theme: data.settings.theme ?? 'system'
		}}
		onExport={() => {}}
		onImport={() => {}}
	/>

	<main class="flex-1 p-8">
		<div class="mx-auto max-w-2xl">
			<h1 class="mb-8 text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

			{#if form?.success}
				<p
					class="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900 dark:text-green-300"
				>
					Settings saved.
				</p>
			{/if}

			{#if form?.error}
				<p
					class="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900 dark:text-red-300"
				>
					{form.error}
				</p>
			{/if}

			<form action="?/default" method="POST" class="space-y-6">
				<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
					<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>

					<div class="mb-4">
						<label
							for="theme"
							class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label
						>
						<select
							id="theme"
							name="theme"
							value={form?.theme || data.settings.theme}
							class="w-full rounded border bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
						>
							<option value="system">System</option>
							<option value="light">Light</option>
							<option value="dark">Dark</option>
						</select>
					</div>

					<div>
						<label
							for="accentColor"
							class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>Accent Color</label
						>
						<div class="flex items-center gap-3">
							<input
								type="color"
								id="accentColor"
								name="accentColor"
								value={form?.accentColor || data.settings.accentColor}
								class="h-10 w-10 rounded border dark:border-gray-600"
							/>
							<input
								type="text"
								name="accentColor"
								value={form?.accentColor || data.settings.accentColor}
								class="flex-1 rounded border bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
								readonly
							/>
						</div>
					</div>
				</div>

				<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
					<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>

					<div class="mb-4">
						<label
							for="timezone"
							class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>Timezone</label
						>
						<input
							id="timezone"
							name="timezone"
							type="text"
							value={form?.timezone || data.settings.timezone}
							placeholder="UTC"
							class="w-full rounded border bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
						/>
					</div>

					<div class="flex items-center gap-2">
						<input
							id="shortcutsEnabled"
							name="shortcutsEnabled"
							type="checkbox"
							checked={form?.shortcutsEnabled ?? data.settings.shortcutsEnabled}
							class="h-4 w-4 rounded border-gray-300"
						/>
						<label
							for="shortcutsEnabled"
							class="text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Enable keyboard shortcuts
						</label>
					</div>
				</div>

				<button
					type="submit"
					class="rounded bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"
				>
					Save Settings
				</button>
			</form>
		</div>
	</main>

	<Toast />
	<Search />
</div>
