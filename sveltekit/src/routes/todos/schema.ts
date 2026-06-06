import { z } from 'zod';

export const TODO_TITLE_MAX_LENGTH = 120;

export const todoIdSchema = z.coerce.number<string | number>().int().positive();

export const saveTodoSchema = z.object({
	id: todoIdSchema.optional(),
	title: z
		.string()
		.trim()
		.min(1, 'Title required')
		.max(TODO_TITLE_MAX_LENGTH, `Title max ${TODO_TITLE_MAX_LENGTH} chars`)
});
