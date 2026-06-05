import { command, form, query, requested } from '$app/server';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { todos, type Todo } from '$lib/server/db/schema';
import { getTodoTitleError, parseTodoTitle } from '$lib/todo-validation';

export type TodoSummary = Pick<Todo, 'id' | 'createdAt'>;
export type TodoItem = Pick<
	Todo,
	'id' | 'title' | 'completed' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;

type TodoFormInput = {
	id?: string | number;
	title: string;
};

const now = () => new Date();

async function refreshRequestedTodoQueries() {
	await Promise.all([listTodoIds().refresh(), requested(getTodo, 100).refreshAll()]);
}

export const listTodoIds = query(async () => {
	return db
		.select({ id: todos.id, createdAt: todos.createdAt })
		.from(todos)
		.where(isNull(todos.deletedAt))
		.orderBy(desc(todos.createdAt), desc(todos.id));
});

export const getTodo = query.batch('unchecked', async (ids: number[]) => {
	const rows = ids.length ? await db.select().from(todos).where(inArray(todos.id, ids)) : [];
	const byId = new Map(rows.map((todo) => [todo.id, todo]));

	return (id) => {
		const todo = byId.get(id);
		if (!todo) {
			throw new Error('Todo not found');
		}

		return todo satisfies TodoItem;
	};
});

export const saveTodo = form('unchecked', async (data: TodoFormInput, issue) => {
	const error = getTodoTitleError(data.title);

	if (error) {
		throw issue.title(error);
	}

	const title = parseTodoTitle(data.title);
	const updatedAt = now();
	const id = data.id ? Number(data.id) : undefined;

	if (id) {
		await db
			.update(todos)
			.set({ title, updatedAt })
			.where(and(eq(todos.id, id), isNull(todos.deletedAt)));
	} else {
		await db.insert(todos).values({ title, createdAt: updatedAt, updatedAt });
	}

	await refreshRequestedTodoQueries();
});

export const toggleTodo = command(
	'unchecked',
	async ({ id, completed }: { id: number; completed: boolean }) => {
		await db
			.update(todos)
			.set({ completed, updatedAt: now() })
			.where(and(eq(todos.id, id), isNull(todos.deletedAt)));

		await refreshRequestedTodoQueries();
	}
);

export const deleteTodo = command('unchecked', async (id: number) => {
	await db
		.update(todos)
		.set({ deletedAt: now(), updatedAt: now() })
		.where(and(eq(todos.id, id), isNull(todos.deletedAt)));

	await refreshRequestedTodoQueries();
});

export const restoreTodo = command('unchecked', async (id: number) => {
	await db
		.update(todos)
		.set({ deletedAt: null, updatedAt: now(), createdAt: sql`${todos.createdAt}` })
		.where(eq(todos.id, id));

	await refreshRequestedTodoQueries();
});
