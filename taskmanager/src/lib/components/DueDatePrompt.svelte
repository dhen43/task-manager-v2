<script lang="ts">
	let {
		taskId = null,
		onDateSet,
		onClose
	}: {
		taskId: number | null;
		onDateSet: (date: string | null) => void;
		onClose: () => void;
	} = $props();

	let visible = $state(true);
	let pickerOpen = $state(false);
	let customDate = $state('');

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	async function setQuickDate(dateStr: string | null) {
		onDateSet(dateStr);
		visible = false;
		onClose();
	}

	function getDate(offsetDays: number) {
		const d = new Date(Date.now() + offsetDays * 86400000);
		return d.toISOString().split('T')[0];
	}

	function getEndOfWeek() {
		const d = new Date();
		const day = d.getDay();
		const daysUntilSunday = day === 0 ? 0 : 7 - day;
		d.setDate(d.getDate() + daysUntilSunday);
		return d.toISOString().split('T')[0];
	}
</script>

{#if visible}
	<div
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		onkeydown={handleKeydown}
		tabindex="0"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
	>
		<div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
			<h3 class="mb-4 text-center text-lg font-bold">When is this due?</h3>
			<div class="mb-3 grid grid-cols-5 gap-2">
				<button
					onclick={() => setQuickDate(getDate(0))}
					class="rounded bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
				>
					Today
				</button>
				<button
					onclick={() => setQuickDate(getDate(1))}
					class="rounded bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
				>
					Tomorrow
				</button>
				<button
					onclick={() => setQuickDate(getEndOfWeek())}
					class="rounded bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
				>
					This Week
				</button>
				<button
					onclick={() => {
						pickerOpen = !pickerOpen;
					}}
					class="rounded bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
				>
					Pick..
				</button>
				<button
					onclick={() => setQuickDate(null)}
					class="rounded bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
				>
					None
				</button>
			</div>
			{#if pickerOpen}
				<input
					type="date"
					bind:value={customDate}
					onblur={() => {
						if (customDate) setQuickDate(customDate);
					}}
					autofocus
					class="w-full rounded border bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
				/>
			{/if}
		</div>
	</div>
{/if}
