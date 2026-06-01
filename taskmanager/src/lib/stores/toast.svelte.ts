interface Toast {
	id: number;
	message: string;
	action?: { label: string; handler: () => void };
	duration?: number;
}

let toasts = $state<Toast[]>([]);
let nextId = 1;

export function showToast(
	message: string,
	options?: {
		action?: { label: string; handler: () => void };
		duration?: number;
	}
) {
	const id = nextId++;
	const toast: Toast = {
		id,
		message,
		action: options?.action,
		duration: options?.duration ?? 3000
	};
	toasts.push(toast);

	if (toast.duration) {
		setTimeout(() => removeToast(id), toast.duration);
	}
}

export function removeToast(id: number) {
	toasts = toasts.filter((t) => t.id !== id);
}

export const toastStore = {
	get values() {
		return toasts;
	},
	showToast,
	removeToast
};
