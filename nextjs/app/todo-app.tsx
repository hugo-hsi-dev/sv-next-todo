"use client";

import { useForm } from "@tanstack/react-form";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useOptimistic, useRef, useState, useTransition } from "react";
import type { TodoView } from "./actions";
import {
  submitCreate,
  submitDelete,
  submitEdit,
  submitToggle,
} from "./todo-mutations";
import { applyOptimistic } from "./todo-optimistic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getTodoTitleError } from "@/lib/todo-validation";

export function TodoApp({ initialTodos }: { initialTodos: TodoView[] }) {
  const [todos, dispatch] = useOptimistic(initialTodos, applyOptimistic);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const mutationVersions = useRef(new Map<number, number>());
  const beginMutation = (id: number) => {
    const version = (mutationVersions.current.get(id) ?? 0) + 1;
    mutationVersions.current.set(id, version);
    return version;
  };
  const isCurrentMutation = (id: number, version: number) => mutationVersions.current.get(id) === version;
  const mutationContext = {
    dispatch,
    setEditingId,
    startTransition,
    beginMutation,
    isCurrentMutation,
  };

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
    <>
      <div className="mb-3 flex items-center justify-between">
        <Badge variant="outline">{todos.length} active items</Badge>
        {isPending ? (
          <Badge role="status" aria-live="polite" variant="secondary">
            Saving
          </Badge>
        ) : null}
      </div>

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
                aria-describedby={field.state.meta.errors.length ? "create-title-error" : undefined}
                aria-invalid={field.state.meta.errors.length > 0}
                maxLength={120}
                name={field.name}
                placeholder="New task"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {field.state.meta.errors.length ? (
                <p id="create-title-error" className="mt-1 text-xs text-red-600">
                  {field.state.meta.errors[0]}
                </p>
              ) : null}
            </div>
          )}
        </createForm.Field>
        <Button
          aria-label="Add todo"
          size="icon-lg"
          className="shrink-0"
          disabled={isPending}
          title="Add"
          type="submit"
        >
          <Plus size={18} />
        </Button>
      </form>

      <Card className="gap-0 py-0">
        <CardContent className="px-0">
          {todos.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-zinc-500">No tasks</div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {todos.map((todo) => (
                <li key={todo.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2">
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => submitToggle(todo, mutationContext)}
                    aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
                    title={todo.completed ? "Mark incomplete" : "Mark complete"}
                  />
                  {editingId === todo.id ? (
                    <EditForm
                      todo={todo}
                      onCancel={() => setEditingId(null)}
                      onSave={(title) => submitEdit(todo, title, mutationContext)}
                    />
                  ) : (
                    <>
                      <span
                        className={`flex h-9 min-w-0 items-center truncate text-sm ${
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
                        aria-label="Edit todo"
                        title="Edit"
                        type="button"
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => submitDelete(todo, mutationContext)}
                        aria-label="Delete todo"
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
        </CardContent>
      </Card>
    </>
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
      className="contents"
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
              aria-describedby={field.state.meta.errors.length ? `edit-title-error-${todo.id}` : undefined}
              aria-invalid={field.state.meta.errors.length > 0}
              autoFocus
              className="h-9 px-2"
              maxLength={120}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            {field.state.meta.errors.length ? (
              <p id={`edit-title-error-${todo.id}`} className="mt-1 text-xs text-red-600">
                {field.state.meta.errors[0]}
              </p>
            ) : null}
          </div>
        )}
      </form.Field>
      <Button aria-label="Save todo" size="icon" className="shrink-0" title="Save" type="submit">
        <Check size={15} />
      </Button>
      <Button
        aria-label="Cancel edit"
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={onCancel}
        title="Cancel"
        type="button"
      >
        <X size={15} />
      </Button>
    </form>
  );
}
