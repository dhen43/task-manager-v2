<script lang="ts">
	let {
		visible,
		onClose
	}: {
		visible: boolean;
		onClose: () => void;
	} = $props();

	const shortcuts = [
		{
			category: 'Navigation',
			items: [
				{ keys: '1-5', desc: 'Switch views' },
				{ keys: 'Cmd+K', desc: 'Search' }
			]
		},
		{
			category: 'Tasks',
			items: [
				{ keys: 'Cmd+N', desc: 'New task' },
				{ keys: 'Space', desc: 'Toggle completed' },
				{ keys: 'Enter', desc: 'Open task editor' },
				{ keys: 'D', desc: 'Delete task' }
			]
		},
		{
			category: 'Projects',
			items: [{ keys: 'Cmd+P', desc: 'New project' }]
		},
		{
			category: 'General',
			items: [
				{ keys: 'Cmd+Z', desc: 'Undo' },
				{ keys: 'Esc', desc: 'Close modal' },
				{ keys: 'Cmd+Enter', desc: 'Save in modal' },
				{ keys: '?', desc: 'Show/hide shortcuts' }
			]
		}
	];
</script>

{#if visible}
	<div
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
	>
		<div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-xl font-bold">Keyboard Shortcuts</h2>
				<button onclick={onClose} class="text-xl text-gray-400 hover:text-gray-600">&#x2715;</button
				>
			</div>
			{#each shortcuts as section}
				<div class="mb-4">
					<h3 class="mb-2 text-xs font-bold text-gray-400 uppercase">{section.category}</h3>
					{#each section.items as item}
						<div class="flex items-center justify-between py-1">
							<span class="text-sm">{item.desc}</span>
							<kbd class="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-gray-800">
								{item.keys}
							</kbd>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
{/if}
