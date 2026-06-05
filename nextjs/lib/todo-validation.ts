import { z } from "zod";

export const todoTitleSchema = z
  .string()
  .trim()
  .min(1, "Title required")
  .max(120, "Max 120 chars");

export const todoInputSchema = z.object({
  title: todoTitleSchema,
});

export function parseTodoTitle(value: unknown) {
  return todoTitleSchema.parse(value);
}

export function getTodoTitleError(value: string) {
  return todoTitleSchema.safeParse(value).error?.issues[0]?.message;
}
