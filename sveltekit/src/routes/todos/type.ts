import type { Todo } from '$lib/server/db/schema';

export type TodoItem = Pick<
	Todo,
	'id' | 'title' | 'completed' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;
