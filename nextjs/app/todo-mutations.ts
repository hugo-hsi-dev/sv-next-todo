"use client";

import type { Dispatch, SetStateAction, TransitionStartFunction } from "react";
import { toast } from "sonner";
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
  startTransition: TransitionStartFunction;
  beginMutation: (id: number) => number;
  isCurrentMutation: (id: number, version: number) => boolean;
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
  context: MutationContext,
) {
  const { dispatch, startTransition } = context;
  const title = parseTodoTitle(titleValue);
  const tempTodo = createOptimisticTodo(title);
  const version = context.beginMutation(tempTodo.id);

  startTransition(async () => {
    try {
      dispatch({ type: "create", todo: tempTodo });
      resetForm();
      const saved = await createTodo({ title });
      if (context.isCurrentMutation(tempTodo.id, version)) {
        dispatch({ type: "replaceId", fromId: tempTodo.id, todo: saved });
      }
    } catch {
      if (context.isCurrentMutation(tempTodo.id, version)) {
        dispatch({ type: "remove", id: tempTodo.id });
      }
      toast.error("Could not create todo.");
    }
  });
}

export function submitEdit(todo: TodoView, titleValue: string, context: MutationContext) {
  const { dispatch, setEditingId, startTransition } = context;
  const title = parseTodoTitle(titleValue);
  const version = context.beginMutation(todo.id);

  startTransition(async () => {
    try {
      dispatch({ type: "replace", todo: { ...todo, title, updatedAt: Date.now() } });
      setEditingId(null);
      const saved = await updateTodo(todo.id, { title });
      if (context.isCurrentMutation(todo.id, version)) {
        dispatch({ type: "replace", todo: saved });
      }
    } catch {
      if (context.isCurrentMutation(todo.id, version)) {
        dispatch({ type: "replace", todo });
      }
      toast.error("Could not update todo.");
    }
  });
}

export function submitToggle(todo: TodoView, context: MutationContext) {
  const { dispatch, startTransition } = context;
  const version = context.beginMutation(todo.id);

  startTransition(async () => {
    try {
      dispatch({
        type: "replace",
        todo: { ...todo, completed: !todo.completed, updatedAt: Date.now() },
      });
      const saved = await toggleTodo(todo.id, !todo.completed);
      if (context.isCurrentMutation(todo.id, version)) {
        dispatch({ type: "replace", todo: saved });
      }
    } catch {
      if (context.isCurrentMutation(todo.id, version)) {
        dispatch({ type: "replace", todo });
      }
      toast.error("Could not toggle todo.");
    }
  });
}

export function submitDelete(todo: TodoView, context: MutationContext) {
  const { dispatch, startTransition } = context;
  const version = context.beginMutation(todo.id);

  startTransition(async () => {
    try {
      dispatch({ type: "remove", id: todo.id });
      toast(`Deleted ${todo.title}`, {
        action: {
          label: "Undo",
          onClick: () => submitRestore(todo, context),
        },
      });
      await deleteTodo(todo.id);
    } catch {
      if (context.isCurrentMutation(todo.id, version)) {
        dispatch({ type: "restore", todo });
      }
      toast.error("Could not delete todo.");
    }
  });
}

export function submitRestore(todo: TodoView, context: MutationContext) {
  const { dispatch, startTransition } = context;
  const version = context.beginMutation(todo.id);

  startTransition(async () => {
    try {
      dispatch({ type: "restore", todo });
      const saved = await restoreTodo(todo.id);
      if (context.isCurrentMutation(todo.id, version)) {
        dispatch({ type: "replace", todo: saved });
      }
    } catch {
      if (context.isCurrentMutation(todo.id, version)) {
        dispatch({ type: "remove", id: todo.id });
      }
      toast.error("Could not restore todo.");
    }
  });
}
