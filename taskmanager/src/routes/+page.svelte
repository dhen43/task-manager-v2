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
			tasks: any[];
			completedTasks: any[];
			overdueCount: number;
			projects: any[];
			settings: any;
			user: any;
		};
	} = $props();

	let taskList = $state(data.tasks);
	let completedList = $state(data.completedTasks);
	let selectedTaskId = $state<number | null>(null);
	let showDueDatePrompt = $state(false);
	let promptTaskId = $state<number | null>(null);
	let showShortcuts = $state(false);
	let expandedCompleted = $state(false);

	async function toggleTask(id: number) {
		const task = taskList.find((t) => t.id === id);
		if (!task) return;
		const newCompleted = !task.completed;

		await fetch('/api/tasks', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id, completed: newCompleted })
		});

		if (newCompleted) {
			taskList = taskList.filter((t) => t.id !== id);
			completedList.push({ ...task, completed: true });
			showToast('Task completed', {
				action: {
					label: 'Undo',
					handler: async () => {
						await fetch('/api/tasks', {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ id, completed: false })
						});
						completedList = completedList.filter((t) => t.id !== id);
						taskList.push({ ...task, completed: false });
					}
				}
			});
		} else {
			task.completed = false;
		}
	}

	async function deleteTask(id: number) {
		await fetch('/api/tasks', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id })
		});
		const deletedTask = taskList.find((t) => t.id === id);
		taskList = taskList.filter((t) => t.id !== id);
		showToast('Task deleted', {
			action: {
				label: 'Undo',
				handler: async () => {
					if (deletedTask) {
						await fetch('/api/tasks', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(deletedTask)
						});
						taskList.push(deletedTask);
					}
				}
			}
		});
	}

	function handleTaskCreated(task: any) {
		taskList.push(task);
		if (!task.dueDate) {
			promptTaskId = task.id;
			showDueDatePrompt = true;
		}
	}

	async function handleDateSet(date: string | null) {
		if (promptTaskId !== null) {
			await fetch('/api/tasks', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: promptTaskId, dueDate: date })
			});
			const task = taskList.find((t) => t.id === promptTaskId);
			if (task) task.dueDate = date;
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
			<h1 class="mb-1 text-3xl font-bold">Today</h1>
			<p class="mb-6 text-gray-500">
				{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
			</p>

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

			{#if completedList.length > 0}
				<div class="mt-4">
					<button
						onclick={() => (expandedCompleted = !expandedCompleted)}
						class="text-sm text-gray-400 hover:text-gray-600"
					>
						─── {completedList.length} completed ({expandedCompleted ? 'collapse' : 'expand'} ▾)
					</button>
					{#if expandedCompleted}
						<div class="mt-2 space-y-1">
							{#each completedList as task (task.id)}
								<TaskListItem
									{task}
									isSelected={selectedTaskId === task.id}
									onToggle={toggleTask}
									onOpen={(id) => openModal('task', id)}
									onDelete={deleteTask}
									onSelect={(id) => (selectedTaskId = id)}
									onNavigate={() => {}}
								/>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

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
