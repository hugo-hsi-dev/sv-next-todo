import type { TodoItem, TodoSummary } from './todos.remote';
import { getTodoTitleError } from '$lib/todo-validation';

export function createOptimisticTodo(title: string): TodoItem {
	const now = new Date();

	return {
		id: -Date.now(),
		title,
		completed: false,
		deletedAt: null,
		createdAt: now,
		updatedAt: now
	};
}

export function canOptimisticallyAdd(title: string) {
	return !getTodoTitleError(title);
}

export function nextOptimisticIds(ids: TodoSummary[], removeId?: number, addTodo?: TodoItem) {
	const next = removeId ? ids.filter(({ id }) => id !== removeId) : ids;
	return addTodo ? [addTodo, ...next] : next;
}
