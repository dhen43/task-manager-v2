<script lang="ts">
	import { onMount } from 'svelte';
	import { modalStore } from '$lib/stores/modal.svelte';

	let { onClose, onCreated }: { onClose: () => void; onCreated?: () => void } = $props();

	let modal = $derived(modalStore.values);
	let title = $state('');
	let description = $state('');
	let projectId: number | null = $state(modal.editingId);
	let persisted = $state(!!modal.editingId);
	let errorMessage = $state('');

	onMount(async () => {
		if (!modal.editingId) return;
		try {
			const res = await fetch('/api/projects');
			const projects = await res.json();
			const project = projects.find(
				(p: { id: number; title: string; description?: string | null }) => p.id === modal.editingId
			);
			if (project) {
				title = project.title;
				description = project.description || '';
			}
		} catch {
			errorMessage = 'Failed to load project';
		}
	});

	async function handleSave() {
		if (!title.trim()) return;
		const payload = {
			id: projectId,
			title: title.trim(),
			description: description.trim() || null
		};

		const method = projectId ? 'PUT' : 'POST';
		const body = projectId ? payload : { title: payload.title, description: payload.description };

		try {
			const res = await fetch('/api/projects', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (res.ok) {
				if (!projectId) {
					const created = await res.json();
					projectId = created.id;
					onCreated?.();
				}
				persisted = true;
				onClose();
			} else {
				errorMessage = 'Failed to save project';
			}
		} catch {
			errorMessage = 'Failed to save project';
		}
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
		<h2 class="text-xl font-bold">{modal.editingId ? 'Edit Project' : 'New Project'}</h2>
		<button onclick={onClose} class="text-xl text-gray-400 hover:text-gray-600">✕</button>
	</div>

	<div class="space-y-4">
		{#if errorMessage}
			<div class="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
				{errorMessage}
				<button onclick={() => (errorMessage = '')} class="ml-2 font-bold">✕</button>
			</div>
		{/if}

		<div>
			<input
				type="text"
				bind:value={title}
				placeholder="Project name..."
				maxlength="128"
				autofocus
				class="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-1 text-lg font-medium focus:border-indigo-500 focus:outline-none dark:border-gray-700"
			/>
		</div>

		<div>
			<label class="mb-1 block text-sm text-gray-500">Description</label>
			<textarea
				bind:value={description}
				placeholder="Description..."
				maxlength="2048"
				rows="3"
				class="w-full resize-none rounded border bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
			></textarea>
		</div>
	</div>

	<div class="mt-6 flex gap-2">
		<button
			onclick={handleSave}
			class="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
		>
			{persisted ? 'Save &amp; Close' : 'Create'}
		</button>
		<button onclick={onClose} class="px-4 py-2 text-gray-500 hover:text-gray-700"> Cancel </button>
	</div>
</div>
