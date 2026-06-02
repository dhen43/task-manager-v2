<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import TaskListItem from '$lib/components/TaskListItem.svelte';
	import SlideOver from '$lib/components/SlideOver.svelte';
	import TaskEditor from '$lib/components/TaskEditor.svelte';
	import ProjectEditor from '$lib/components/ProjectEditor.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import Search from '$lib/components/Search.svelte';
	import ShortcutHelp from '$lib/components/ShortcutHelp.svelte';
	import { openModal, modalStore } from '$lib/stores/modal.svelte';
	import { showToast } from '$lib/stores/toast.svelte';

	let {
		data
	}: {
		data: {
			tasks: any[];
			projects: any[];
			settings: any;
			user: any;
		};
	} = $props();

	let taskList = $state(data.tasks);
	let selectedTaskId = $state<number | null>(null);
	let showShortcuts = $state(false);

	async function toggleTask(id: number) {
		const task = taskList.find((t) => t.id === id);
		if (!task) return;
		const newCompleted = !task.completed;

		const prevTaskList = [...taskList];

		try {
			await fetch('/api/tasks', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, completed: newCompleted })
			});
			taskList = taskList.filter((t) => t.id !== id);
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
							taskList.push({ ...task, completed: false });
						} catch {
							taskList = prevTaskList;
							showToast('Failed to undo', {});
						}
					}
				}
			});
		} catch {
			taskList = prevTaskList;
			showToast('Failed to update task', {});
		}
	}

	async function deleteTask(id: number) {
		const deletedTask = taskList.find((t) => t.id === id);
		if (!deletedTask) return;
		const prevTaskList = [...taskList];

		try {
			await fetch('/api/tasks', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			taskList = taskList.filter((t) => t.id !== id);
		} catch {
			taskList = prevTaskList;
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
							taskList.push(deletedTask);
						} catch {
							taskList = prevTaskList;
							showToast('Failed to undo deletion', {});
						}
					}
				}
			}
		});
	}

	function handleTaskCreated(task: any) {
		if (!task.dueDate) {
			taskList.push(task);
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
			<h1 class="mb-1 text-3xl font-bold">Inbox</h1>
			<p class="mb-6 text-gray-500">Tasks without a due date</p>

			<div class="mb-6 space-y-1">
				{#each taskList as task (task.id)}
					<TaskListItem
						{task}
						isSelected={selectedTaskId === task.id}
						onToggle={toggleTask}
						onOpen={(id) => openModal('task', id)}
						onDelete={deleteTask}
						onSelect={(id) => (selectedTaskId = id)}
						onNavigate={(dir) => {
							const idx = taskList.findIndex((t) => t.id === selectedTaskId);
							const nextIdx = dir === 'down' ? idx + 1 : idx - 1;
							if (nextIdx >= 0 && nextIdx < taskList.length) {
								selectedTaskId = taskList[nextIdx].id;
							}
						}}
					/>
				{/each}
			</div>

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
			{:else if modalStore.values.type === 'project'}
				<ProjectEditor onClose={() => modalStore.closeModal()} />
			{/if}
		{/snippet}
	</SlideOver>

	<Toast />
	<Search />
	<ShortcutHelp visible={showShortcuts} onClose={() => (showShortcuts = false)} />
</div>
