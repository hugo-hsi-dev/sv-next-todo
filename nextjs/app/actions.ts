"use server";

import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "../db";
import { todos, type Todo } from "../db/schema";
import { parseTodoTitle } from "@/lib/todo-validation";

export type TodoView = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

export type TodoInput = {
  title: string;
};

function toView(todo: Todo): TodoView {
  return {
    id: todo.id,
    title: todo.title,
    completed: todo.completed,
    createdAt: todo.createdAt.getTime(),
    updatedAt: todo.updatedAt.getTime(),
    deletedAt: todo.deletedAt?.getTime() ?? null,
  };
}

function refresh() {
  revalidatePath("/");
}

const todoInputSchema = z.object({ title: z.string() });
const todoIdSchema = z.number().int().positive();
const completedSchema = z.boolean();

function assertTodo(todo: Todo | undefined) {
  if (!todo) {
    throw new Error("Todo not found.");
  }
  return todo;
}

export async function listTodos() {
  const rows = await db
    .select()
    .from(todos)
    .where(isNull(todos.deletedAt))
    .orderBy(desc(todos.createdAt), desc(todos.id));

  return rows.map(toView);
}

export async function createTodo(input: TodoInput) {
  const parsedInput = todoInputSchema.parse(input);
  const now = new Date();
  const [todo] = await db
    .insert(todos)
    .values({ title: parseTodoTitle(parsedInput.title), completed: false, createdAt: now, updatedAt: now })
    .returning();

  refresh();
  return toView(assertTodo(todo));
}

export async function updateTodo(id: number, input: TodoInput) {
  const todoId = todoIdSchema.parse(id);
  const parsedInput = todoInputSchema.parse(input);
  const [todo] = await db
    .update(todos)
    .set({ title: parseTodoTitle(parsedInput.title), updatedAt: new Date() })
    .where(and(eq(todos.id, todoId), isNull(todos.deletedAt)))
    .returning();

  refresh();
  return toView(assertTodo(todo));
}

export async function toggleTodo(id: number, completed: boolean) {
  const todoId = todoIdSchema.parse(id);
  const todoCompleted = completedSchema.parse(completed);
  const [todo] = await db
    .update(todos)
    .set({ completed: todoCompleted, updatedAt: new Date() })
    .where(and(eq(todos.id, todoId), isNull(todos.deletedAt)))
    .returning();

  refresh();
  return toView(assertTodo(todo));
}

export async function deleteTodo(id: number) {
  const todoId = todoIdSchema.parse(id);
  const updatedAt = new Date();
  const [todo] = await db
    .update(todos)
    .set({ deletedAt: updatedAt, updatedAt })
    .where(and(eq(todos.id, todoId), isNull(todos.deletedAt)))
    .returning();

  refresh();
  return toView(assertTodo(todo));
}

export async function restoreTodo(id: number) {
  const todoId = todoIdSchema.parse(id);
  const [todo] = await db
    .update(todos)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(todos.id, todoId), isNotNull(todos.deletedAt)))
    .returning();

  refresh();
  return toView(assertTodo(todo));
}
