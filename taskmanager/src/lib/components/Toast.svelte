<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';

	let toasts = $derived(toastStore.values);
</script>

<div class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 space-y-2">
	{#each toasts as toast (toast.id)}
		<div
			class="animate-slide-up flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-2 text-white shadow-lg dark:bg-gray-100 dark:text-gray-900"
		>
			<span class="text-sm">{toast.message}</span>
			{#if toast.action}
				<button
					onclick={() => {
						if (toast.action) toast.action.handler();
						toastStore.removeToast(toast.id);
					}}
					class="text-sm font-medium text-indigo-400 underline dark:text-indigo-600"
				>
					{toast.action.label}
				</button>
			{/if}
		</div>
	{/each}
</div>
