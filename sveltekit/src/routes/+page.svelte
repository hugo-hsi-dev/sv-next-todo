<script lang="ts">
	import {
		deleteTodo,
		getTodo,
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
		return todoIds.withOverride((ids: TodoSummary[]) => {
			const next = removeId ? ids.filter(({ id }) => id !== removeId) : ids;
			return addTodo ? [{ id: addTodo.id, createdAt: addTodo.createdAt }, ...next] : next;
		});
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
				const tempId = -Date.now();
				const now = new Date();
				const optimisticTodo: TodoItem = {
					id: tempId,
					title,
					completed: false,
					deletedAt: null,
					createdAt: now,
					updatedAt: now
				};

				const canOptimisticallyAdd = title && title.length <= 120;

				if (canOptimisticallyAdd) {
					optimisticTodos[tempId] = optimisticTodo;
				}

				try {
					await form
						.submit()
						.updates(canOptimisticallyAdd ? optimisticIds(undefined, optimisticTodo) : todoIds);
					form.element.reset();
				} finally {
					delete optimisticTodos[tempId];
				}
			})}
		>
			<input
				class="h-9 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 transition outline-none focus:border-zinc-950"
				name="title"
				maxlength="120"
				required
				placeholder="Add todo"
			/>
			<button
				class="h-9 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
				disabled={saveTodo.pending > 0}
			>
				Add
			</button>
		</form>

		{#if saveTodo.result}
			<p class="text-sm text-red-600">Could not save todo.</p>
		{/if}

		<div class="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
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
						{@const todo = getTodo(summary.id)}
						{#if todo.current}
							{@const editForm = saveTodo.for(todo.current.id)}
							<div class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 px-3 py-2">
								<input
									class="size-4"
									type="checkbox"
									checked={todo.current.completed}
									disabled={toggleTodo.pending > 0}
									onchange={(event) => {
										const completed = event.currentTarget.checked;
										void toggleTodo({ id: todo.current.id, completed }).updates(
											todo.withOverride((item) => ({ ...item, completed }))
										);
									}}
									aria-label="Toggle todo"
								/>

								<form
									class="min-w-0"
									id={`todo-${todo.current.id}`}
									{...editForm.enhance(async (form) => {
										const title = String(form.fields.title.value() ?? '').trim();
										await form
											.submit()
											.updates(
												todo.withOverride((item) => ({ ...item, title, updatedAt: new Date() }))
											);
									})}
								>
									<input type="hidden" name="id" value={todo.current.id} />
									<input
										class:line-through={todo.current.completed}
										class="h-8 w-full rounded-md border border-transparent px-2 text-sm text-zinc-950 transition outline-none hover:border-zinc-200 focus:border-zinc-950 disabled:text-zinc-400"
										name="title"
										value={todo.current.title}
										maxlength="120"
										required
										disabled={editForm.pending > 0}
										aria-label="Todo title"
									/>
								</form>

								<button
									class="h-8 rounded-md px-2 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50"
									type="submit"
									form={`todo-${todo.current.id}`}
									disabled={editForm.pending > 0}
								>
									Save
								</button>

								<button
									class="h-8 rounded-md px-2 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50"
									disabled={deleteTodo.pending > 0}
									onclick={() => {
										setUndo(todo.current);
										void deleteTodo(todo.current.id).updates(optimisticIds(todo.current.id));
									}}
								>
									Delete
								</button>
							</div>
						{/if}
					{/if}
				{/each}
			{:else}
				<p class="px-3 py-6 text-center text-sm text-zinc-500">No todos yet</p>
			{/if}
		</div>
	</section>
</main>

{#if undoTodo}
	<div
		class="fixed inset-x-4 bottom-4 mx-auto flex max-w-md items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-lg"
	>
		<span class="min-w-0 truncate text-zinc-700">Deleted {undoTodo.title}</span>
		<button
			class="h-8 rounded-md bg-zinc-950 px-3 font-medium text-white transition hover:bg-zinc-800"
			onclick={() => {
				const todo = undoTodo;
				undoTodo = null;
				if (todo) {
					void restoreTodo(todo.id).updates(todoIds);
				}
			}}
		>
			Undo
		</button>
	</div>
{/if}
