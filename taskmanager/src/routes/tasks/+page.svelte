<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import TaskListItem from '$lib/components/TaskListItem.svelte';
	import SlideOver from '$lib/components/SlideOver.svelte';
	import TaskEditor from '$lib/components/TaskEditor.svelte';
	import DueDatePrompt from '$lib/components/DueDatePrompt.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import Search from '$lib/components/Search.svelte';
	import ShortcutHelp from '$lib/components/ShortcutHelp.svelte';
	import { openModal, modalStore } from '$lib/stores/modal.svelte';
	import { showToast } from '$lib/stores/toast.svelte';

	let {
		data
	}: {
		data: {
			grouped: Record<string, any[]>;
			totalTasks: number;
			totalGroups: number;
			projects: any[];
			settings: any;
			user: any;
		};
	} = $props();

	let allTaskGroups = $state(data.grouped);
	let selectedTaskId = $state<number | null>(null);
	let showDueDatePrompt = $state(false);
	let promptTaskId = $state<number | null>(null);
	let showShortcuts = $state(false);

	const groupKeys = Object.keys(allTaskGroups).sort((a, b) => {
		if (a === 'Unassigned') return 1;
		if (b === 'Unassigned') return -1;
		return a.localeCompare(b);
	});

	const totalTasks = $derived(
		groupKeys.reduce((sum, key) => sum + (allTaskGroups[key]?.length ?? 0), 0)
	);
	const totalGroups = $derived(groupKeys.length);

	async function toggleTask(groupId: string, id: number) {
		let group = allTaskGroups[groupId];
		let task = group?.find((t) => t.id === id);
		if (!task) return;
		const newCompleted = !task.completed;

		const prevGroups = JSON.parse(JSON.stringify(allTaskGroups));

		try {
			await fetch('/api/tasks', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, completed: newCompleted })
			});
			allTaskGroups[groupId] = group.filter((t) => t.id !== id);
			showToast('Task completed', {
				action: {
					label: 'Undo',
					handler: async () => {
						try {
							await fetch('/api/tasks', {
								method: 'PUT',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ id, completed: false })
							});
							allTaskGroups[groupId].push({ ...task, completed: false });
						} catch {
							allTaskGroups = prevGroups;
							showToast('Failed to undo', {});
						}
					}
				}
			});
		} catch {
			allTaskGroups = prevGroups;
			showToast('Failed to update task', {});
		}
	}

	async function deleteTask(groupId: string, id: number) {
		let group = allTaskGroups[groupId];
		const deletedTask = group?.find((t) => t.id === id);
		if (!deletedTask) return;
		const prevGroups = JSON.parse(JSON.stringify(allTaskGroups));

		try {
			await fetch('/api/tasks', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			allTaskGroups[groupId] = group.filter((t) => t.id !== id);
		} catch {
			allTaskGroups = prevGroups;
			showToast('Failed to delete task', {});
			return;
		}

		showToast('Task deleted', {
			action: {
				label: 'Undo',
				handler: async () => {
					if (deletedTask) {
						try {
							await fetch('/api/tasks', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(deletedTask)
							});
							allTaskGroups[groupId].push(deletedTask);
						} catch {
							allTaskGroups = prevGroups;
							showToast('Failed to undo deletion', {});
						}
					}
				}
			}
		});
	}

	function handleTaskCreated(task: any) {
		const groupKey = task.projectName || 'Unassigned';
		if (!allTaskGroups[groupKey]) {
			allTaskGroups[groupKey] = [];
		}
		allTaskGroups[groupKey].push(task);
		if (!task.dueDate) {
			promptTaskId = task.id;
			showDueDatePrompt = true;
		}
	}

	async function handleDateSet(date: string | null) {
		if (promptTaskId !== null) {
			try {
				await fetch('/api/tasks', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: promptTaskId, dueDate: date })
				});
				for (const key of Object.keys(allTaskGroups)) {
					const task = allTaskGroups[key].find((t) => t.id === promptTaskId);
					if (task) {
						task.dueDate = date;
						break;
					}
				}
			} catch {
				showToast('Failed to update due date', {});
			}
		}
	}

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
				showToast('Invalid JSON file', {});
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

	const projectNavItems = data.projects.map((p) => ({
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
			<h1 class="mb-1 text-3xl font-bold">All Tasks</h1>
			<p class="mb-6 text-gray-500">
				{totalTasks}
				{totalTasks === 1 ? 'task' : 'tasks'} across {totalGroups}
				{totalGroups === 1 ? 'project' : 'projects'}
			</p>

			{#if groupKeys.length === 0}
				<p class="text-gray-400">No tasks yet. Add one to get started.</p>
			{/if}

			{#each groupKeys as groupKey}
				<div class="mb-6">
					<h2 class="mb-2 text-lg font-semibold text-gray-700">
						{groupKey}
					</h2>
					<div class="space-y-1">
						{#each allTaskGroups[groupKey] as task (task.id)}
							<TaskListItem
								{task}
								isSelected={selectedTaskId === task.id}
								onToggle={(id) => toggleTask(groupKey, id)}
								onOpen={(id) => openModal('task', id)}
								onDelete={(id) => deleteTask(groupKey, id)}
								onSelect={(id) => (selectedTaskId = id)}
								onNavigate={(dir) => {
									const allTasks = groupKeys.flatMap((k) => allTaskGroups[k]);
									const idx = allTasks.findIndex((t) => t.id === selectedTaskId);
									const nextIdx = dir === 'down' ? idx + 1 : idx - 1;
									if (nextIdx >= 0 && nextIdx < allTasks.length) {
										selectedTaskId = allTasks[nextIdx].id;
									}
								}}
							/>
						{/each}
					</div>
				</div>
			{/each}

			<button
				onclick={() => openModal('task')}
				class="mt-6 text-sm text-gray-400 hover:text-gray-600"
			>
				[+] Add a task...
			</button>
		</div>
	</main>

	<SlideOver>
		{#snippet children(_closeFn)}
			{#if modalStore.values.type === 'task'}
				<TaskEditor
					projects={data.projects}
					onClose={() => modalStore.closeModal()}
					onSave={() => modalStore.closeModal()}
					onCreated={handleTaskCreated}
				/>
			{/if}
		{/snippet}
	</SlideOver>

	{#if showDueDatePrompt}
		<DueDatePrompt
			taskId={promptTaskId}
			onDateSet={handleDateSet}
			onClose={() => (showDueDatePrompt = false)}
		/>
	{/if}

	<Toast />
	<Search />
	<ShortcutHelp visible={showShortcuts} onClose={() => (showShortcuts = false)} />
</div>
