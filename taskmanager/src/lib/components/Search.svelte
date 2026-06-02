<script lang="ts">
	let visible = $state(false);
	let query = $state('');
	let results = $state<{ title: string; type: string; id: number; href?: string }[]>([]);
	let loading = $state(false);

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function toggle() {
		visible = !visible;
		if (visible) {
			query = '';
			results = [];
		}
	}

	async function search() {
		if (query.length < 2) {
			results = [];
			return;
		}
		loading = true;
		const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
		results = await res.json();
		loading = false;
	}

	$effect(() => {
		window.addEventListener('toggle-search', toggle);
		window.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') visible = false;
		});

		return () => {
			window.removeEventListener('toggle-search', toggle);
		};
	});
</script>

{#if visible}
	<div
		onclick={(e) => {
			if (e.target === e.currentTarget) visible = false;
		}}
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-20 backdrop-blur-sm"
	>
		<div class="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-900">
			<div class="flex items-center border-b px-4 dark:border-gray-700">
				<svg
					class="mr-2 h-5 w-5 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<input
					bind:value={query}
					oninput={() => {
						if (debounceTimer) clearTimeout(debounceTimer);
						debounceTimer = setTimeout(search, 200);
					}}
					placeholder="Search tasks and projects..."
					autofocus
					class="w-full bg-transparent py-3 focus:outline-none"
				/>
			</div>
			<div class="max-h-80 overflow-y-auto">
				{#if loading}
					<p class="px-4 py-3 text-sm text-gray-400">Searching...</p>
				{:else if results.length === 0 && query.length >= 2}
					<p class="px-4 py-3 text-sm text-gray-400">No results</p>
				{:else}
					{#each results as r}
						<a
							href={r.href || '#'}
							onclick={() => (visible = false)}
							class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							<span class="font-medium">{r.title}</span>
							<span class="ml-2 text-xs text-gray-400">({r.type})</span>
						</a>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
