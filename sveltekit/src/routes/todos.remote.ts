import { command, form, query } from '$app/server';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { todos, type Todo } from '$lib/server/db/schema';
import { getTodoTitleError, parseTodoTitle } from '$lib/todo-validation';

export type TodoItem = Pick<
	Todo,
	'id' | 'title' | 'completed' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;
export type TodoSummary = TodoItem;

type TodoFormInput = {
	id?: string | number;
	title: string;
};

const now = () => new Date();

async function refreshRequestedTodoQueries() {
	await listTodoIds().refresh();
}

export const listTodoIds = query(async () => {
	return db
		.select()
		.from(todos)
		.where(isNull(todos.deletedAt))
		.orderBy(desc(todos.createdAt), desc(todos.id));
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
