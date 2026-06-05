"use client";

import { useForm } from "@tanstack/react-form";
import { Check, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import {
  createTodo,
  deleteTodo,
  restoreTodo,
  toggleTodo,
  updateTodo,
  type TodoView,
} from "./actions";

type OptimisticAction =
  | { type: "create"; todo: TodoView }
  | { type: "replace"; todo: TodoView }
  | { type: "replaceId"; fromId: number; todo: TodoView }
  | { type: "remove"; id: number }
  | { type: "restore"; todo: TodoView };

function sortTodos(items: TodoView[]) {
  return [...items].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
}

function applyOptimistic(state: TodoView[], action: OptimisticAction) {
  if (action.type === "create") return sortTodos([action.todo, ...state]);
  if (action.type === "replace") {
    return sortTodos(state.map((todo) => (todo.id === action.todo.id ? action.todo : todo)));
  }
  if (action.type === "replaceId") {
    return sortTodos(state.map((todo) => (todo.id === action.fromId ? action.todo : todo)));
  }
  if (action.type === "remove") return state.filter((todo) => todo.id !== action.id);
  return sortTodos([action.todo, ...state.filter((todo) => todo.id !== action.todo.id)]);
}

function validateTitle(value: string) {
  const title = value.trim();
  if (!title) return "Title required";
  if (title.length > 120) return "Max 120 chars";
  return undefined;
}

export function TodoApp({ initialTodos }: { initialTodos: TodoView[] }) {
  const [todos, dispatch] = useOptimistic(initialTodos, applyOptimistic);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toast, setToast] = useState<TodoView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const createForm = useForm({
    defaultValues: { title: "" },
    validators: {
      onSubmit: ({ value }) => ({ fields: { title: validateTitle(value.title) } }),
    },
    onSubmit: async ({ value, formApi }) => {
      const title = value.title.trim();
      const now = Date.now();
      const tempTodo: TodoView = {
        id: -now,
        title,
        completed: false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      startTransition(async () => {
        try {
          setError(null);
          dispatch({ type: "create", todo: tempTodo });
          formApi.reset();
          const saved = await createTodo({ title });
          dispatch({ type: "replaceId", fromId: tempTodo.id, todo: saved });
        } catch {
          dispatch({ type: "remove", id: tempTodo.id });
          setError("Could not create todo.");
        }
      });
    },
  });

  function submitEdit(todo: TodoView, title: string) {
    const next = title.trim();
    if (validateTitle(next)) return;

    startTransition(async () => {
      try {
        setError(null);
        dispatch({ type: "replace", todo: { ...todo, title: next, updatedAt: Date.now() } });
        setEditingId(null);
        const saved = await updateTodo(todo.id, { title: next });
        dispatch({ type: "replace", todo: saved });
      } catch {
        dispatch({ type: "replace", todo });
        setError("Could not update todo.");
      }
    });
  }

  function onToggle(todo: TodoView) {
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

  function onDelete(todo: TodoView) {
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

  function onRestore(todo: TodoView) {
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

  return (
    <main className="min-h-screen bg-stone-100 text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-5 sm:px-6">
        <header className="mb-4 flex items-center justify-between border-b border-zinc-200 pb-3">
          <div>
            <h1 className="text-xl font-semibold">Todo</h1>
            <p className="text-sm text-zinc-500">{todos.length} active items</p>
          </div>
          {isPending ? <span className="text-xs text-zinc-500">Saving</span> : null}
        </header>

        <form
          className="mb-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            createForm.handleSubmit();
          }}
        >
          <createForm.Field name="title">
            {(field) => (
              <div className="min-w-0 flex-1">
                <input
                  className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-900"
                  maxLength={120}
                  name={field.name}
                  placeholder="New task"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {field.state.meta.errors.length ? (
                  <p className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</p>
                ) : null}
              </div>
            )}
          </createForm.Field>
          <button
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white transition hover:bg-zinc-700 disabled:opacity-50"
            disabled={isPending}
            title="Add"
            type="submit"
          >
            <Plus size={18} />
          </button>
        </form>

        <section className="overflow-hidden rounded-md border border-zinc-200 bg-white">
          {todos.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-zinc-500">No tasks</div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {todos.map((todo) => (
                <li key={todo.id} className="flex items-center gap-2 px-3 py-2">
                  <button
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 transition hover:border-zinc-900"
                    onClick={() => onToggle(todo)}
                    title={todo.completed ? "Mark incomplete" : "Mark complete"}
                    type="button"
                  >
                    {todo.completed ? <Check size={16} /> : null}
                  </button>
                  {editingId === todo.id ? (
                    <EditForm
                      todo={todo}
                      onCancel={() => setEditingId(null)}
                      onSave={(title) => submitEdit(todo, title)}
                    />
                  ) : (
                    <>
                      <span
                        className={`min-w-0 flex-1 truncate text-sm ${
                          todo.completed ? "text-zinc-400 line-through" : "text-zinc-900"
                        }`}
                      >
                        {todo.title}
                      </span>
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
                        onClick={() => setEditingId(todo.id)}
                        title="Edit"
                        type="button"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-red-50 hover:text-red-700"
                        onClick={() => onDelete(todo)}
                        title="Delete"
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {error ? (
        <div className="fixed bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-700 shadow-lg">
          <span className="min-w-0 flex-1">{error}</span>
          <button className="text-xs font-medium text-red-900" onClick={() => setError(null)} type="button">
            Dismiss
          </button>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-lg">
          <span className="min-w-0 flex-1 truncate">Deleted {toast.title}</span>
          <button
            className="inline-flex h-8 items-center gap-1 rounded-md bg-zinc-950 px-2 text-xs text-white"
            onClick={() => onRestore(toast)}
            type="button"
          >
            <RotateCcw size={14} />
            Undo
          </button>
        </div>
      ) : null}
    </main>
  );
}

function EditForm({
  todo,
  onCancel,
  onSave,
}: {
  todo: TodoView;
  onCancel: () => void;
  onSave: (title: string) => void;
}) {
  const form = useForm({
    defaultValues: { title: todo.title },
    validators: {
      onSubmit: ({ value }) => ({ fields: { title: validateTitle(value.title) } }),
    },
    onSubmit: async ({ value }) => onSave(value.title),
  });

  return (
    <form
      className="flex min-w-0 flex-1 items-start gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name="title">
        {(field) => (
          <div className="min-w-0 flex-1">
            <input
              autoFocus
              className="h-8 w-full rounded-md border border-zinc-300 px-2 text-sm outline-none focus:border-zinc-900"
              maxLength={120}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            {field.state.meta.errors.length ? (
              <p className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</p>
            ) : null}
          </div>
        )}
      </form.Field>
      <button
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white"
        title="Save"
        type="submit"
      >
        <Check size={15} />
      </button>
      <button
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-300"
        onClick={onCancel}
        title="Cancel"
        type="button"
      >
        <X size={15} />
      </button>
    </form>
  );
}
