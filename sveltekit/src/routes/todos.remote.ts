import { command, form, query, requested } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { and, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { todos } from '$lib/server/db/schema';
import { createTodoSchema, editTodoSchema, todoIdSchema, toggleTodoSchema } from './todos/schema';
import type { TodoItem } from './todos/type';

export type { TodoItem };

export const listTodoIds = query(async () => {
	return db
		.select({ id: todos.id })
		.from(todos)
		.where(isNull(todos.deletedAt))
		.orderBy(desc(todos.createdAt), desc(todos.id))
		.then((rows) => rows.map(({ id }) => id));
});

export const getTodoDetails = query.batch(todoIdSchema, async (ids) => {
	const rows = await db.select().from(todos).where(inArray(todos.id, ids));
	const detailsById = new Map(rows.map((todo) => [todo.id, todo]));

	return (id) => detailsById.get(id) ?? invalid('Todo not found.');
});

export const createTodo = form(createTodoSchema, async ({ title }) => {
	const updatedAt = new Date();

	await db.insert(todos).values({ title, createdAt: updatedAt, updatedAt });
	await requested(listTodoIds, 1).refreshAll();
});

export const editTodo = form(editTodoSchema, async ({ id, title }) => {
	const [updatedTodo] = await db
		.update(todos)
		.set({ title, updatedAt: new Date() })
		.where(and(eq(todos.id, id), isNull(todos.deletedAt)))
		.returning();

	if (!updatedTodo) {
		invalid('Todo not found.');
	}

	await requested(getTodoDetails, 1).refreshAll();
});

export const toggleTodo = command(toggleTodoSchema, async ({ id, completed }) => {
	const [updatedTodo] = await db
		.update(todos)
		.set({ completed, updatedAt: new Date() })
		.where(and(eq(todos.id, id), isNull(todos.deletedAt)))
		.returning({ id: todos.id });

	if (!updatedTodo) {
		throw new Error('Todo not found.');
	}

	await requested(getTodoDetails, 1).refreshAll();
});

export const deleteTodo = command(todoIdSchema, async (id) => {
	const updatedAt = new Date();
	const [updatedTodo] = await db
		.update(todos)
		.set({ deletedAt: updatedAt, updatedAt })
		.where(and(eq(todos.id, id), isNull(todos.deletedAt)))
		.returning({ id: todos.id });

	if (!updatedTodo) {
		throw new Error('Todo not found.');
	}

	await requested(listTodoIds, 1).refreshAll();
});

export const restoreTodo = command(todoIdSchema, async (id) => {
	const [updatedTodo] = await db
		.update(todos)
		.set({ deletedAt: null, updatedAt: new Date() })
		.where(and(eq(todos.id, id), isNotNull(todos.deletedAt)))
		.returning({ id: todos.id });

	if (!updatedTodo) {
		throw new Error('Todo not found.');
	}

	await requested(listTodoIds, 1).refreshAll();
	await requested(getTodoDetails, 1).refreshAll();
});
