import { z } from 'zod';

export const todoIdSchema = z.coerce.number<string | number>().int().positive();

const todoTitleSchema = z.string().trim().min(1, 'Title required').max(120, 'Title max 120 chars');

export const createTodoSchema = z.object({
	title: todoTitleSchema
});

export const editTodoSchema = z.object({
	id: todoIdSchema,
	title: todoTitleSchema
});

export const toggleTodoSchema = z.object({
	id: todoIdSchema,
	completed: z.boolean()
});
