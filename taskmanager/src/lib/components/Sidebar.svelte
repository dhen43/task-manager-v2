<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let navItems = [
		{ label: 'Today', href: '/', key: '1', badge: { type: 'overdue', count: 0 } },
		{ label: 'Upcoming', href: '/upcoming', key: '2', badge: { type: 'count', count: 0 } },
		{ label: 'Inbox', href: '/inbox', key: '3', badge: { type: 'count', count: 0 } },
		{ label: 'Tasks', href: '/tasks', key: '4', badge: { type: 'count', count: 0 } },
		{ label: 'Projects', href: '/projects', key: '5', badge: null }
	];

	let {
		projectNavItems = [],
		settings,
		onExport,
		onImport
	}: {
		projectNavItems?: { label: string; href: string; count: number; active?: boolean }[];
		settings: { shortcutsEnabled: boolean; theme: string };
		onExport: () => void;
		onImport: () => void;
	} = $props();
</script>

<aside
	class="flex h-screen w-56 flex-col border-r border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
>
	<div class="mb-8 flex items-center gap-2">
		<span class="text-lg font-bold">⬡ Task Manager</span>
	</div>

	<nav aria-label="Main navigation" class="flex-1 space-y-1">
		{#each navItems as item}
			<button
				onclick={() => goto(item.href)}
				aria-current={$page.url.pathname === item.href ? 'page' : undefined}
				class="flex w-full items-center justify-between rounded px-2 py-1.5 text-left transition hover:bg-gray-200 dark:hover:bg-gray-800
					{$page.url.pathname === item.href
					? 'bg-gray-200 font-medium dark:bg-gray-800'
					: 'text-gray-600 dark:text-gray-400'}"
			>
				<div class="flex items-center gap-2">
					{#if item.badge?.type === 'overdue' && item.badge.count > 0}
						<span class="h-2 w-2 rounded-full bg-red-500"></span>
					{/if}
					<span>{item.label}</span>
				</div>
				{#if item.badge && item.badge.count > 0}
					<span class="text-xs text-gray-400">{item.badge.count}</span>
				{/if}
			</button>
		{/each}
	</nav>

	{#if projectNavItems.length > 0}
		<div class="my-4 border-t border-gray-200 dark:border-gray-800"></div>
		<nav aria-label="Projects" class="space-y-1">
			{#each projectNavItems as project}
				<button
					onclick={() => goto(project.href)}
					aria-current={$page.url.pathname === project.href ? 'page' : undefined}
					class="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition hover:bg-gray-200 dark:hover:bg-gray-800
						{$page.url.pathname === project.href ? 'bg-gray-200 font-medium dark:bg-gray-800' : ''}"
				>
					<span>{project.label}</span>
					<span class="text-xs text-gray-400">{project.count}</span>
				</button>
			{/each}
		</nav>
	{/if}

	<div class="mt-auto space-y-1 border-t border-gray-200 pt-4 dark:border-gray-800">
		<button
			onclick={onExport}
			class="w-full rounded px-2 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
		>
			Export
		</button>
		<button
			onclick={onImport}
			class="w-full rounded px-2 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
		>
			Import
		</button>
		<button
			onclick={() => goto('/settings')}
			class="w-full rounded px-2 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
		>
			Settings
		</button>
	</div>
</aside>
