import { command, form, query, requested } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '$lib/server/db';
import { todos } from '$lib/server/db/schema';
import { saveTodoSchema, todoIdSchema } from './todos/schema';
import type { TodoItem } from './todos/type';

export type { TodoItem };

export const listTodos = query(async () => {
	return db
		.select()
		.from(todos)
		.where(isNull(todos.deletedAt))
		.orderBy(desc(todos.createdAt), desc(todos.id));
});

const toggleTodoSchema = z.object({ id: todoIdSchema, completed: z.boolean() });

export const saveTodo = form(saveTodoSchema, async ({ id, title }) => {
	const updatedAt = new Date();

	if (id) {
		const [updatedTodo] = await db
			.update(todos)
			.set({ title, updatedAt })
			.where(and(eq(todos.id, id), isNull(todos.deletedAt)))
			.returning({ id: todos.id });

		if (!updatedTodo) {
			invalid('Todo not found.');
		}
	} else {
		await db.insert(todos).values({ title, createdAt: updatedAt, updatedAt });
	}

	await requested(listTodos, 1).refreshAll();
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

	await requested(listTodos, 1).refreshAll();
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

	await requested(listTodos, 1).refreshAll();
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

	await requested(listTodos, 1).refreshAll();
});
