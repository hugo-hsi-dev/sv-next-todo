<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		canOptimisticallyAdd,
		createOptimisticTodo,
		nextOptimisticIds
	} from './todo-page-helpers';
	import {
		deleteTodo,
		listTodoIds,
		restoreTodo,
		saveTodo,
		toggleTodo
	} from './todos.remote';
	import type { TodoItem, TodoSummary } from './todos.remote';

	const todoIds = listTodoIds();
	let undoTodo = $state<TodoItem | null>(null);
	let optimisticTodos = $state<Record<number, TodoItem>>({});
	let undoTimer: ReturnType<typeof setTimeout> | undefined;

	function optimisticIds(removeId?: number, addTodo?: TodoItem) {
		return todoIds.withOverride((ids: TodoSummary[]) => nextOptimisticIds(ids, removeId, addTodo));
	}

	function setUndo(todo: TodoItem) {
		undoTodo = todo;
		if (undoTimer) clearTimeout(undoTimer);
		undoTimer = setTimeout(() => (undoTodo = null), 5000);
	}
</script>

<svelte:head>
	<title>Todos</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-8">
	<section class="space-y-4">
		<header class="flex items-center justify-between gap-4">
			<div>
				<h1 class="text-2xl font-semibold tracking-normal text-zinc-950">Todos</h1>
				<p class="text-sm text-zinc-500">Newest first</p>
			</div>
			<div class="rounded-md border border-zinc-200 px-2.5 py-1 text-sm text-zinc-600">
				{todoIds.current?.length ?? 0}
			</div>
		</header>

		<form
			class="flex gap-2"
			{...saveTodo.enhance(async (form) => {
				const title = String(form.fields.title.value() ?? '').trim();
				const optimisticTodo = createOptimisticTodo(title);
				const shouldOptimisticallyAdd = canOptimisticallyAdd(title);

				if (shouldOptimisticallyAdd) {
					optimisticTodos[optimisticTodo.id] = optimisticTodo;
				}

				try {
					await form
						.submit()
						.updates(shouldOptimisticallyAdd ? optimisticIds(undefined, optimisticTodo) : todoIds);
					form.element.reset();
				} finally {
					delete optimisticTodos[optimisticTodo.id];
				}
			})}
		>
			<Input class="flex-1" name="title" maxlength={120} required placeholder="Add todo" />
			<Button type="submit" disabled={saveTodo.pending > 0}>Add</Button>
		</form>

		{#if saveTodo.result}
			<p class="text-sm text-red-600">Could not save todo.</p>
		{/if}

		<Card.Root class="gap-0 divide-y divide-zinc-200 p-0">
			{#if todoIds.loading}
				<p class="px-3 py-6 text-center text-sm text-zinc-500">Loading...</p>
			{:else if todoIds.current?.length}
				{#each todoIds.current as summary (summary.id)}
					{#if summary.id < 0 && optimisticTodos[summary.id]}
						{@const todo = optimisticTodos[summary.id]}
						<div class="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2 opacity-70">
							<input class="size-4" type="checkbox" disabled aria-label="Toggle todo" />
							<span class="h-8 min-w-0 rounded-md px-2 text-sm leading-8 text-zinc-950">
								{todo.title}
							</span>
							<span class="px-2 text-xs text-zinc-500">Saving</span>
						</div>
					{:else}
						{@const todo = summary}
						{@const editForm = saveTodo.for(todo.id)}
							<div class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 px-3 py-2">
								<input
									class="size-4"
									type="checkbox"
									checked={todo.completed}
									disabled={toggleTodo.pending > 0}
									onchange={(event: Event & { currentTarget: HTMLInputElement }) => {
										const completed = event.currentTarget.checked;
										void toggleTodo({ id: todo.id, completed }).updates(
											todoIds.withOverride((items) =>
												items.map((item) =>
													item.id === todo.id ? { ...item, completed } : item
												)
											)
										);
									}}
									aria-label="Toggle todo"
								/>

								<form
									class="min-w-0"
									id={`todo-${todo.id}`}
									{...editForm.enhance(async (form) => {
										const title = String(form.fields.title.value() ?? '').trim();
										await form
											.submit()
											.updates(
												todoIds.withOverride((items) =>
													items.map((item) =>
														item.id === todo.id ? { ...item, title, updatedAt: new Date() } : item
													)
												)
											);
									})}
								>
									<input type="hidden" name="id" value={todo.id} />
									<Input
										class={`h-8 border-transparent px-2 hover:border-zinc-200 ${todo.completed ? 'line-through' : ''}`}
										name="title"
										value={todo.title}
										maxlength={120}
										required
										disabled={editForm.pending > 0}
										aria-label="Todo title"
									/>
								</form>

								<Button
									variant="ghost"
									size="sm"
									type="submit"
									form={`todo-${todo.id}`}
									disabled={editForm.pending > 0}
								>
									Save
								</Button>

								<Button
									variant="ghost"
									size="sm"
									disabled={deleteTodo.pending > 0}
									onclick={() => {
										setUndo(todo);
										void deleteTodo(todo.id).updates(optimisticIds(todo.id));
									}}
								>
									Delete
								</Button>
							</div>
					{/if}
				{/each}
			{:else}
				<p class="px-3 py-6 text-center text-sm text-zinc-500">No todos yet</p>
			{/if}
		</Card.Root>
	</section>
</main>

{#if undoTodo}
	<div
		class="fixed inset-x-4 bottom-4 mx-auto flex max-w-md items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-lg"
	>
		<span class="min-w-0 truncate text-zinc-700">Deleted {undoTodo.title}</span>
		<Button
			size="sm"
			onclick={() => {
				const todo = undoTodo;
				undoTodo = null;
				if (todo) {
					void restoreTodo(todo.id).updates(todoIds);
				}
			}}
		>
			Undo
		</Button>
	</div>
{/if}
