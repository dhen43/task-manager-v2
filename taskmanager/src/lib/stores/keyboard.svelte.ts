import { openModal } from './modal.svelte';
import { goto } from '$app/navigation';

let enabled = $state(true);
let contextProjectId = $state<number | null>(null);

const viewMap: Record<string, string> = {
	'1': '/',
	'2': '/upcoming',
	'3': '/inbox',
	'4': '/tasks',
	'5': '/projects'
};

const keydownHandler = (e: KeyboardEvent) => {
	if (!enabled) return;

	// Ignore if user is in an input/textarea (with exceptions for global shortcuts)
	const tag = (e.target as HTMLElement).tagName;
	const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

	if (e.metaKey || e.ctrlKey) {
		switch (e.key.toLowerCase()) {
			case 'n':
				e.preventDefault();
				openModal('task', undefined, contextProjectId);
				break;
			case 'p':
				e.preventDefault();
				openModal('project');
				break;
			case 'k':
				e.preventDefault();
				// Focus search — handled by Search component
				window.dispatchEvent(new CustomEvent('toggle-search'));
				break;
			case 'enter':
				if (isInput) {
					e.preventDefault();
					// Save and close modal — handled by SlideOver
					window.dispatchEvent(new CustomEvent('modal-save'));
				}
				break;
			case 'z':
				e.preventDefault();
				window.dispatchEvent(new CustomEvent('undo'));
				break;
		}
	} else if (!isInput) {
		if (viewMap[e.key]) {
			e.preventDefault();
			goto(viewMap[e.key]);
		}
		if (e.key === '?') {
			e.preventDefault();
			window.dispatchEvent(new CustomEvent('toggle-shortcuts'));
		}
		if (e.key === 'Escape') {
			window.dispatchEvent(new CustomEvent('close-all'));
		}
	}
};

export function initKeyboardShortcuts(initialProjectId?: number | null) {
	contextProjectId = initialProjectId ?? null;
	window.removeEventListener('keydown', keydownHandler);
	window.addEventListener('keydown', keydownHandler);
}

export const keyboardStore = {
	get enabled() {
		return enabled;
	},
	set enabled(value) {
		enabled = value;
	},
	initKeyboardShortcuts,
	setContextProjectId: (id: number | null) => {
		contextProjectId = id;
	}
};
