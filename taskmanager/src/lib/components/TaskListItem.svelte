<script lang="ts">
	let {
		task,
		isSelected,
		onToggle,
		onOpen,
		onDelete,
		onSelect,
		onNavigate
	}: {
		task: {
			id: number;
			title: string;
			completed: boolean;
			dueDate: string | null;
			priority: string;
			projectId: number | null;
			projectName?: string | null;
		};
		isSelected: boolean;
		onToggle: (id: number) => void;
		onOpen: (id: number) => void;
		onDelete: (id: number) => void;
		onSelect: (id: number) => void;
		onNavigate: (direction: 'up' | 'down') => void;
	} = $props();

	function getDueDateColor() {
		if (!task.dueDate) return 'text-gray-400';
		const today = new Date().toISOString().split('T')[0];
		if (task.dueDate === today) return 'text-green-500';
		if (task.dueDate < today && !task.completed) return 'text-red-500';
		return 'text-blue-500';
	}

	function getDueDateLabel() {
		if (!task.dueDate) return '';
		const today = new Date().toISOString().split('T')[0];
		const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
		if (task.dueDate === today) return 'Today';
		if (task.dueDate === tomorrow) return 'Tomorrow';
		return task.dueDate;
	}

	function getPriorityDot() {
		const colors: Record<string, string> = {
			urgent: 'bg-red-500',
			medium: 'bg-orange-400',
			low: 'bg-yellow-400'
		};
		return task.priority && task.priority !== 'none' ? colors[task.priority] : '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isSelected) return;
		switch (e.key) {
			case ' ':
				e.preventDefault();
				onToggle(task.id);
				break;
			case 'Enter':
				e.preventDefault();
				onOpen(task.id);
				break;
			case 'd':
			case 'D':
				e.preventDefault();
				onDelete(task.id);
				break;
			case 'ArrowDown':
				e.preventDefault();
				onNavigate('down');
				break;
			case 'ArrowUp':
				e.preventDefault();
				onNavigate('up');
				break;
		}
	}
</script>

<button
	onclick={() => onOpen(task.id)}
	onkeydown={handleKeydown}
	onfocus={() => onSelect(task.id)}
	class="group flex w-full items-center gap-3 rounded px-3 py-2 text-left
		{isSelected ? 'ring-2 ring-indigo-500' : ''}
		{task.completed ? 'opacity-50' : ''}
		transition hover:bg-gray-100 focus:outline-none dark:hover:bg-gray-800"
>
	<input
		type="checkbox"
		checked={task.completed}
		onchange={() => onToggle(task.id)}
		onclick={(e) => e.stopPropagation()}
		class="h-4 w-4 cursor-pointer rounded"
	/>
	<span class="flex-1 {task.completed ? 'line-through' : ''}">
		{task.title}
	</span>
	{#if task.projectName}
		<span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-400 dark:bg-gray-800">
			▸ {task.projectName}
		</span>
	{/if}
	<span class={getDueDateColor() + ' text-sm'}>
		{getDueDateLabel()}
	</span>
	{#if getPriorityDot()}
		<span class={getPriorityDot() + ' h-2 w-2 rounded-full'}></span>
	{/if}
</button>
