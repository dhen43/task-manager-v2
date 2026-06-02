<script lang="ts">
	import { goto } from '$app/navigation';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SlideOver from '$lib/components/SlideOver.svelte';
	import ProjectEditor from '$lib/components/ProjectEditor.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import Search from '$lib/components/Search.svelte';
	import ShortcutHelp from '$lib/components/ShortcutHelp.svelte';
	import { openModal, modalStore } from '$lib/stores/modal.svelte';

	let {
		data
	}: {
		data: {
			projects: { id: number; title: string; description: string | null; taskCount: number }[];
			allProjects: { id: number; title: string }[];
			settings: any;
			user: any;
		};
	} = $props();

	let showShortcuts = $state(false);

	function handleExport() {
		window.open('/api/export', '_blank');
	}

	async function handleImport() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			const text = await file.text();
			let json: any;
			try {
				json = JSON.parse(text);
			} catch {
				return;
			}
			await fetch('/api/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(json)
			});
			window.location.reload();
		};
		input.click();
	}

	const projectNavItems = data.allProjects.map((p) => ({
		label: p.title,
		href: `/projects/${p.id}`,
		count: 0
	}));
</script>

<div class="flex">
	<Sidebar
		{projectNavItems}
		settings={data.settings ?? { shortcutsEnabled: true, theme: 'system' }}
		onExport={handleExport}
		onImport={handleImport}
	/>

	<main class="flex-1 overflow-y-auto p-8">
		<div class="mx-auto max-w-3xl">
			<h1 class="mb-1 text-3xl font-bold">Projects</h1>
			<p class="mb-6 text-gray-500">
				{data.projects.length}
				{data.projects.length === 1 ? 'project' : 'projects'}
			</p>

			<div class="grid grid-cols-2 gap-4">
				{#each data.projects as project}
					<button
						onclick={() => goto(`/projects/${project.id}`)}
						class="rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-indigo-500 dark:border-gray-700 dark:bg-gray-800"
					>
						<h3 class="mb-1 text-lg font-bold">{project.title}</h3>
						{#if project.description}
							<p class="mb-3 line-clamp-2 text-sm text-gray-500">{project.description}</p>
						{/if}
						<p class="text-xs text-gray-400">
							{project.taskCount}
							{project.taskCount !== 1 ? 'tasks' : 'task'}
						</p>
					</button>
				{/each}

				<button
					onclick={() => openModal('project')}
					class="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-left transition hover:border-indigo-500 dark:border-gray-700 dark:bg-gray-900"
				>
					<span class="text-2xl text-gray-400">+</span>
					<span class="text-sm text-gray-500">New Project</span>
				</button>
			</div>
		</div>
	</main>

	<SlideOver>
		{#snippet children(_closeFn)}
			{#if modalStore.values.type === 'project'}
				<ProjectEditor
					onClose={() => modalStore.closeModal()}
					onCreated={() => window.location.reload()}
				/>
			{/if}
		{/snippet}
	</SlideOver>

	<Toast />
	<Search />
	<ShortcutHelp visible={showShortcuts} onClose={() => (showShortcuts = false)} />
</div>
