import { command, form, query } from '$app/server';
import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

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
const idSchema = z.coerce.number().int().positive();
const saveTodoSchema = z.object({
	id: z.union([z.string(), z.number()]).optional(),
	title: z.string()
});
const toggleTodoSchema = z.object({ id: idSchema, completed: z.boolean() });

async function refreshRequestedTodoQueries() {
	await listTodos().refresh();
}

export const listTodos = query(async () => {
	return db
		.select()
		.from(todos)
		.where(isNull(todos.deletedAt))
		.orderBy(desc(todos.createdAt), desc(todos.id));
});

export const saveTodo = form(saveTodoSchema, async (data: TodoFormInput, issue) => {
	const error = getTodoTitleError(data.title);

	if (error) {
		throw issue.title(error);
	}

	const title = parseTodoTitle(data.title);
	const updatedAt = now();
	const parsedId = data.id ? idSchema.safeParse(data.id) : undefined;

	if (parsedId && !parsedId.success) {
		throw issue.title('Todo not found.');
	}

	const id = parsedId?.data;

	if (id) {
		const [updatedTodo] = await db
			.update(todos)
			.set({ title, updatedAt })
			.where(and(eq(todos.id, id), isNull(todos.deletedAt)))
			.returning({ id: todos.id });

		if (!updatedTodo) {
			throw issue.title('Todo not found.');
		}
	} else {
		await db.insert(todos).values({ title, createdAt: updatedAt, updatedAt });
	}

	await refreshRequestedTodoQueries();
});

export const toggleTodo = command(toggleTodoSchema, async ({ id, completed }) => {
	const [updatedTodo] = await db
		.update(todos)
		.set({ completed, updatedAt: now() })
		.where(and(eq(todos.id, id), isNull(todos.deletedAt)))
		.returning({ id: todos.id });

	if (!updatedTodo) {
		throw new Error('Todo not found.');
	}

	await refreshRequestedTodoQueries();
});

export const deleteTodo = command(idSchema, async (id) => {
	const updatedAt = now();
	const [updatedTodo] = await db
		.update(todos)
		.set({ deletedAt: updatedAt, updatedAt })
		.where(and(eq(todos.id, id), isNull(todos.deletedAt)))
		.returning({ id: todos.id });

	if (!updatedTodo) {
		throw new Error('Todo not found.');
	}

	await refreshRequestedTodoQueries();
});

export const restoreTodo = command(idSchema, async (id) => {
	const [updatedTodo] = await db
		.update(todos)
		.set({ deletedAt: null, updatedAt: now(), createdAt: sql`${todos.createdAt}` })
		.where(and(eq(todos.id, id), isNotNull(todos.deletedAt)))
		.returning({ id: todos.id });

	if (!updatedTodo) {
		throw new Error('Todo not found.');
	}

	await refreshRequestedTodoQueries();
});
