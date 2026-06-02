<script lang="ts">
	import type { Snippet } from 'svelte';
	import { modalStore } from '$lib/stores/modal.svelte';

	let { children }: { children: Snippet<[() => void]> } = $props();

	let visible = $derived(modalStore.values.open);

	function handleClose() {
		modalStore.closeModal();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}

	$effect(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	$effect(() => {
		window.addEventListener('modal-save', handleClose as EventListener);
		return () => {
			window.removeEventListener('modal-save', handleClose as EventListener);
		};
	});
</script>

{#if visible}
	<div
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		tabindex="0"
		class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="absolute top-0 right-0 bottom-0 w-full max-w-lg overflow-y-auto bg-white shadow-xl dark:bg-gray-900"
		>
			{@render children(handleClose)}
		</div>
	</div>
{/if}
