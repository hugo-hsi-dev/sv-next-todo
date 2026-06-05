"use client";

import { useForm } from "@tanstack/react-form";
import { Check, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import type { TodoView } from "./actions";
import {
  submitCreate,
  submitDelete,
  submitEdit,
  submitRestore,
  submitToggle,
} from "./todo-mutations";
import { applyOptimistic } from "./todo-optimistic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getTodoTitleError } from "@/lib/todo-validation";

export function TodoApp({ initialTodos }: { initialTodos: TodoView[] }) {
  const [todos, dispatch] = useOptimistic(initialTodos, applyOptimistic);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toast, setToast] = useState<TodoView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const mutationContext = { dispatch, setEditingId, setToast, setError, startTransition };

  const createForm = useForm({
    defaultValues: { title: "" },
    validators: {
      onSubmit: ({ value }) => ({ fields: { title: getTodoTitleError(value.title) } }),
    },
    onSubmit: async ({ value, formApi }) => {
      submitCreate(value.title, () => formApi.reset(), mutationContext);
    },
  });

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
                <Input
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
          <Button size="icon-lg" className="shrink-0" disabled={isPending} title="Add" type="submit">
            <Plus size={18} />
          </Button>
        </form>

        <Card>
          {todos.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-zinc-500">No tasks</div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {todos.map((todo) => (
                <li key={todo.id} className="flex items-center gap-2 px-3 py-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 text-zinc-700 hover:border-zinc-900"
                    onClick={() => submitToggle(todo, mutationContext)}
                    title={todo.completed ? "Mark incomplete" : "Mark complete"}
                    type="button"
                  >
                    {todo.completed ? <Check size={16} /> : null}
                  </Button>
                  {editingId === todo.id ? (
                    <EditForm
                      todo={todo}
                      onCancel={() => setEditingId(null)}
                      onSave={(title) => submitEdit(todo, title, mutationContext)}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-500"
                        onClick={() => setEditingId(todo.id)}
                        title="Edit"
                        type="button"
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => submitDelete(todo, mutationContext)}
                        title="Delete"
                        type="button"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {error ? (
        <div className="fixed bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-700 shadow-lg">
          <span className="min-w-0 flex-1">{error}</span>
          <Button variant="ghost" size="sm" className="text-red-900" onClick={() => setError(null)} type="button">
            Dismiss
          </Button>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-lg">
          <span className="min-w-0 flex-1 truncate">Deleted {toast.title}</span>
          <Button size="sm" className="text-xs" onClick={() => submitRestore(toast, mutationContext)} type="button">
            <RotateCcw size={14} />
            Undo
          </Button>
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
      onSubmit: ({ value }) => ({ fields: { title: getTodoTitleError(value.title) } }),
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
            <Input
              autoFocus
              className="h-8 px-2"
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
      <Button size="icon" className="shrink-0" title="Save" type="submit">
        <Check size={15} />
      </Button>
      <Button variant="outline" size="icon" className="shrink-0" onClick={onCancel} title="Cancel" type="button">
        <X size={15} />
      </Button>
    </form>
  );
}
