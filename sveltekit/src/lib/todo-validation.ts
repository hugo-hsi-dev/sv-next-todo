import { z } from 'zod';

export const todoTitleSchema = z
	.string()
	.trim()
	.min(1, 'Title required')
	.max(120, 'Title max 120 chars');

export const todoFormSchema = z.object({
	id: z.union([z.string(), z.number()]).optional(),
	title: todoTitleSchema
});

export function parseTodoTitle(value: unknown) {
	return todoTitleSchema.parse(value);
}

export function getTodoTitleError(value: unknown) {
	return todoTitleSchema.safeParse(value).error?.issues[0]?.message;
}
