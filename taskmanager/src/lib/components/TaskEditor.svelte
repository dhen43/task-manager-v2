<script lang="ts">
	import { onMount } from 'svelte';
	import { modalStore } from '$lib/stores/modal.svelte';

	let {
		projects = [],
		onClose,
		onSave,
		onCreated
	}: {
		projects?: { id: number; title: string }[];
		onClose: () => void;
		onSave?: (data: any) => void;
		onCreated?: (task: any) => void;
	} = $props();

	let modal = $derived(modalStore.values);
	let title = $state('');
	let description = $state('');
	let dueDate = $state('');
	let priority = $state('none');
	let selectedProjectId: number | null = $state(modal.contextProjectId);
	let selectedProjectIdStr: string = $state(
		selectedProjectId !== null ? String(selectedProjectId) : ''
	);
	let taskId: number | null = $state(modal.editingId);
	let persisted = $state(false);

	$effect(() => {
		if (modal.contextProjectId !== selectedProjectId) {
			selectedProjectId = modal.contextProjectId;
			selectedProjectIdStr = selectedProjectId !== null ? String(selectedProjectId) : '';
		}
	});

	onMount(async () => {
		if (!modal.editingId) return;
		const res = await fetch(`/api/tasks?id=${modal.editingId}`);
		const task = await res.json();
		title = task.title;
		description = task.description || '';
		dueDate = task.dueDate || '';
		priority = task.priority || 'none';
		selectedProjectId = task.projectId;
		selectedProjectIdStr = selectedProjectId !== null ? String(selectedProjectId) : '';
		taskId = task.id;
		persisted = true;
	});

	function handleTitleBlur() {
		if (title.trim() && !persisted) {
			createTask();
		}
	}

	async function createTask() {
		const projectIdNum = selectedProjectIdStr !== '' ? parseInt(selectedProjectIdStr, 10) : null;

		const payload = {
			title: title.trim(),
			description: description.trim() || null,
			dueDate: dueDate || null,
			projectId: projectIdNum,
			priority
		};
		const res = await fetch('/api/tasks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const task = await res.json();
		taskId = task.id;
		persisted = true;
		onCreated?.(task);
	}

	async function handleSave() {
		if (!taskId) return;
		const projectIdNum = selectedProjectIdStr !== '' ? parseInt(selectedProjectIdStr, 10) : null;

		const payload = {
			id: taskId,
			title: title.trim(),
			description: description.trim() || null,
			dueDate: dueDate || null,
			projectId: projectIdNum,
			priority
		};
		await fetch('/api/tasks', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			handleSave();
		}
	}
</script>

<div onkeydown={handleKeydown} class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-xl font-bold">{modal.editingId ? 'Edit Task' : 'New Task'}</h2>
		<button onclick={onClose} class="text-xl text-gray-400 hover:text-gray-600">✕</button>
	</div>

	<div class="space-y-4">
		<div>
			<input
				type="text"
				bind:value={title}
				onblur={handleTitleBlur}
				placeholder="Title..."
				maxlength="256"
				autofocus
				class="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-1 text-lg font-medium focus:border-indigo-500 focus:outline-none dark:border-gray-700"
			/>
		</div>

		<div>
			<label class="mb-1 block text-sm text-gray-500">Project</label>
			<select
				bind:value={selectedProjectIdStr}
				class="w-full rounded border bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
			>
				<option value="">No project</option>
				{#each projects as p}
					<option value={String(p.id)}>{p.title}</option>
				{/each}
			</select>
		</div>

		<div>
			<label class="mb-1 block text-sm text-gray-500">Due Date</label>
			<input
				type="date"
				bind:value={dueDate}
				class="w-full rounded border bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
			/>
		</div>

		<div>
			<label class="mb-1 block text-sm text-gray-500">Priority</label>
			<select
				bind:value={priority}
				class="w-full rounded border bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
			>
				<option value="none">None</option>
				<option value="low">Low</option>
				<option value="medium">Medium</option>
				<option value="urgent">Urgent</option>
			</select>
		</div>

		<div>
			<label class="mb-1 block text-sm text-gray-500">Description</label>
			<textarea
				bind:value={description}
				placeholder="Description..."
				maxlength="4096"
				rows="4"
				class="w-full resize-none rounded border bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
			></textarea>
		</div>
	</div>

	<div class="mt-6 flex gap-2">
		{#if persisted}
			<button
				onclick={handleSave}
				class="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
			>
				Save &amp; Close
			</button>
		{/if}
		<button onclick={onClose} class="px-4 py-2 text-gray-500 hover:text-gray-700"> Close </button>
	</div>
</div>
