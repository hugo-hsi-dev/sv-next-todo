"use client";

import type { Dispatch, SetStateAction, TransitionStartFunction } from "react";
import {
  createTodo,
  deleteTodo,
  restoreTodo,
  toggleTodo,
  updateTodo,
  type TodoView,
} from "./actions";
import type { OptimisticAction } from "./todo-optimistic";
import { parseTodoTitle } from "@/lib/todo-validation";

type MutationContext = {
  dispatch: (action: OptimisticAction) => void;
  setEditingId: Dispatch<SetStateAction<number | null>>;
  setToast: Dispatch<SetStateAction<TodoView | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  startTransition: TransitionStartFunction;
};

export function createOptimisticTodo(title: string): TodoView {
  const now = Date.now();
  return {
    id: -now,
    title,
    completed: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export function submitCreate(
  titleValue: string,
  resetForm: () => void,
  { dispatch, setError, startTransition }: MutationContext,
) {
  const title = parseTodoTitle(titleValue);
  const tempTodo = createOptimisticTodo(title);

  startTransition(async () => {
    try {
      setError(null);
      dispatch({ type: "create", todo: tempTodo });
      resetForm();
      const saved = await createTodo({ title });
      dispatch({ type: "replaceId", fromId: tempTodo.id, todo: saved });
    } catch {
      dispatch({ type: "remove", id: tempTodo.id });
      setError("Could not create todo.");
    }
  });
}

export function submitEdit(todo: TodoView, titleValue: string, context: MutationContext) {
  const { dispatch, setEditingId, setError, startTransition } = context;
  const title = parseTodoTitle(titleValue);

  startTransition(async () => {
    try {
      setError(null);
      dispatch({ type: "replace", todo: { ...todo, title, updatedAt: Date.now() } });
      setEditingId(null);
      const saved = await updateTodo(todo.id, { title });
      dispatch({ type: "replace", todo: saved });
    } catch {
      dispatch({ type: "replace", todo });
      setError("Could not update todo.");
    }
  });
}

export function submitToggle(todo: TodoView, { dispatch, setError, startTransition }: MutationContext) {
  startTransition(async () => {
    try {
      setError(null);
      dispatch({
        type: "replace",
        todo: { ...todo, completed: !todo.completed, updatedAt: Date.now() },
      });
      const saved = await toggleTodo(todo.id, !todo.completed);
      dispatch({ type: "replace", todo: saved });
    } catch {
      dispatch({ type: "replace", todo });
      setError("Could not toggle todo.");
    }
  });
}

export function submitDelete(todo: TodoView, context: MutationContext) {
  const { dispatch, setError, setToast, startTransition } = context;

  startTransition(async () => {
    try {
      setError(null);
      dispatch({ type: "remove", id: todo.id });
      setToast(todo);
      await deleteTodo(todo.id);
    } catch {
      dispatch({ type: "restore", todo });
      setToast(null);
      setError("Could not delete todo.");
    }
  });
}

export function submitRestore(todo: TodoView, context: MutationContext) {
  const { dispatch, setError, setToast, startTransition } = context;

  startTransition(async () => {
    try {
      setError(null);
      dispatch({ type: "restore", todo });
      setToast(null);
      const saved = await restoreTodo(todo.id);
      dispatch({ type: "replace", todo: saved });
    } catch {
      dispatch({ type: "remove", id: todo.id });
      setError("Could not restore todo.");
    }
  });
}
