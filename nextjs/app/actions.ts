"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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

export async function listTodos() {
  const rows = await db
    .select()
    .from(todos)
    .where(isNull(todos.deletedAt))
    .orderBy(desc(todos.createdAt), desc(todos.id));

  return rows.map(toView);
}

export async function createTodo(input: TodoInput) {
  const now = new Date();
  const [todo] = await db
    .insert(todos)
    .values({ title: parseTodoTitle(input.title), completed: false, createdAt: now, updatedAt: now })
    .returning();

  refresh();
  return toView(todo);
}

export async function updateTodo(id: number, input: TodoInput) {
  const [todo] = await db
    .update(todos)
    .set({ title: parseTodoTitle(input.title), updatedAt: new Date() })
    .where(and(eq(todos.id, id), isNull(todos.deletedAt)))
    .returning();

  refresh();
  return toView(todo);
}

export async function toggleTodo(id: number, completed: boolean) {
  const [todo] = await db
    .update(todos)
    .set({ completed, updatedAt: new Date() })
    .where(and(eq(todos.id, id), isNull(todos.deletedAt)))
    .returning();

  refresh();
  return toView(todo);
}

export async function deleteTodo(id: number) {
  const [todo] = await db
    .update(todos)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(todos.id, id), isNull(todos.deletedAt)))
    .returning();

  refresh();
  return toView(todo);
}

export async function restoreTodo(id: number) {
  const [todo] = await db
    .update(todos)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(todos.id, id))
    .returning();

  refresh();
  return toView(todo);
}
