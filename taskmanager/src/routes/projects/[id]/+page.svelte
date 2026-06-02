<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import TaskListItem from '$lib/components/TaskListItem.svelte';
	import SlideOver from '$lib/components/SlideOver.svelte';
	import TaskEditor from '$lib/components/TaskEditor.svelte';
	import ProjectEditor from '$lib/components/ProjectEditor.svelte';
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
			project: { id: number; title: string; description: string | null };
			tasks: any[];
			completedTasks: any[];
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
		let task = taskList.find((t) => t.id === id);
		let inCompleted = false;
		if (!task) {
			task = completedList.find((t) => t.id === id);
			inCompleted = !!task;
		}
		if (!task) return;
		const newCompleted = !task.completed;

		const prevTaskList = [...taskList];
		const prevCompletedList = [...completedList];

		try {
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
							try {
								await fetch('/api/tasks', {
									method: 'PUT',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ id, completed: false })
								});
								completedList = completedList.filter((t) => t.id !== id);
								taskList.push({ ...task, completed: false });
							} catch {
								taskList = prevTaskList;
								completedList = prevCompletedList;
								showToast('Failed to undo', {});
							}
						}
					}
				});
			} else {
				if (inCompleted) {
					completedList = completedList.filter((t) => t.id !== id);
					taskList.push({ ...task, completed: false });
				} else {
					task.completed = false;
				}
			}
		} catch {
			taskList = prevTaskList;
			completedList = prevCompletedList;
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
		taskList.push(task);
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
				const task = taskList.find((t) => t.id === promptTaskId);
				if (task) task.dueDate = date;
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

	function openTaskModal() {
		openModal('task', undefined, data.project.id);
	}

	function openProjectEditModal() {
		openModal('project', data.project.id);
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
			<a href="/projects" class="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700">
				← Back to Projects
			</a>

			<div class="mb-6 flex items-start justify-between">
				<div>
					<h1 class="text-3xl font-bold">{data.project.title}</h1>
					{#if data.project.description}
						<p class="mt-1 text-gray-500">{data.project.description}</p>
					{/if}
				</div>
				<button onclick={openProjectEditModal} class="text-sm text-gray-500 hover:text-gray-700">
					Edit
				</button>
			</div>

			<div class="mb-6 space-y-1">
				{#each taskList as task (task.id)}
					<TaskListItem
						{task}
						isSelected={selectedTaskId === task.id}
						onToggle={toggleTask}
						onOpen={(id) => openModal('task', id, data.project.id)}
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
									onOpen={(id) => openModal('task', id, data.project.id)}
									onDelete={deleteTask}
									onSelect={(id) => (selectedTaskId = id)}
									onNavigate={() => {}}
								/>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<button onclick={openTaskModal} class="mt-6 text-sm text-gray-400 hover:text-gray-600">
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
				<ProjectEditor
					onClose={() => modalStore.closeModal()}
					onCreated={() => window.location.reload()}
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
