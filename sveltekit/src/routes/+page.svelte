<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { listTodos, restoreTodo, saveTodo } from './todos.remote';
	import type { TodoItem } from './todos.remote';
	import TodoRow from './todos/page/TodoRow.svelte';
	import { TODO_TITLE_MAX_LENGTH, saveTodoSchema } from './todos/schema';
	import { toast } from 'svelte-sonner';

	const todos = listTodos();
	let todoItems = $derived(todos.current ?? []);

	function setUndo(todo: TodoItem) {
		toast(`Deleted ${todo.title}`, {
			action: {
				label: 'Undo',
				onClick: () => void restoreTodo(todo.id).updates(todos)
			}
		});
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
				{todos.current?.length ?? 0}
			</div>
		</header>

		<form
			class="space-y-2"
			{...saveTodo.preflight(saveTodoSchema).enhance(async (form) => {
				const title = form.fields.title.value()!;
				const now = new Date();
				const todo = {
					id: -Date.now(),
					title,
					completed: false,
					deletedAt: null,
					createdAt: now,
					updatedAt: now
				};

				if (await form.submit().updates(todos.withOverride((items) => [todo, ...items]))) {
					form.element.reset();
				}
			})}
			oninput={() => saveTodo.validate()}
		>
			<div class="flex gap-2">
				<Input
					class="flex-1"
					{...saveTodo.fields.title.as('text')}
					maxlength={TODO_TITLE_MAX_LENGTH}
					placeholder="Add todo"
					aria-describedby="todo-save-errors"
				/>
				<Button type="submit" disabled={saveTodo.pending > 0}>Add</Button>
			</div>

			<div id="todo-save-errors" class="space-y-1">
				{#each saveTodo.fields.title.issues() as issue (issue.message)}
					<p class="text-sm text-red-600">{issue.message}</p>
				{/each}

				{#each saveTodo.fields.allIssues() as issue (issue.message)}
					{#if !issue.path.length}
						<p class="text-sm text-red-600">{issue.message}</p>
					{/if}
				{/each}
			</div>
		</form>

		<div
			class="group/card flex flex-col gap-0 divide-y divide-zinc-200 overflow-hidden rounded-4xl bg-card p-0 text-sm text-card-foreground shadow-md ring-1 ring-foreground/5"
		>
			{#if todos.loading}
				<p class="px-3 py-6 text-center text-sm text-zinc-500">Loading...</p>
			{:else if todoItems.length}
				{#each todoItems as todo (todo.id)}
					{#if todo.id < 0}
						<div class="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2 opacity-70">
							<input class="size-4" type="checkbox" disabled aria-label="Toggle todo" />
							<span class="h-8 min-w-0 rounded-md px-2 text-sm leading-8 text-zinc-950">
								{todo.title}
							</span>
							<span class="px-2 text-xs text-zinc-500">Saving</span>
						</div>
					{:else}
						<TodoRow {todo} {todos} {setUndo} />
					{/if}
				{/each}
			{:else}
				<p class="px-3 py-6 text-center text-sm text-zinc-500">No todos yet</p>
			{/if}
		</div>
	</section>
</main>
