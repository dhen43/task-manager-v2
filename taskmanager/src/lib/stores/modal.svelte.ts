type ModalType = 'task' | 'project';

interface ModalState {
	open: boolean;
	type: ModalType;
	editingId: number | null;
	contextProjectId: number | null;
}

let state = $state<ModalState>({
	open: false,
	type: 'task',
	editingId: null,
	contextProjectId: null
});

export function openModal(type: ModalType, editingId?: number, contextProjectId?: number | null) {
	state = {
		open: true,
		type,
		editingId: editingId ?? null,
		contextProjectId: contextProjectId ?? null
	};
}

export function closeModal() {
	state = { ...state, open: false, editingId: null, contextProjectId: null };
}

export const modalStore = {
	get values() {
		return state;
	},
	openModal,
	closeModal
};
