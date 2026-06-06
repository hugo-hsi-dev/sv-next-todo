<script lang="ts">
	import { listTodos, restoreTodo } from './todos.remote';
	import TodoCreateForm from './todos/page/TodoCreateForm.svelte';
	import TodoRow from './todos/page/TodoRow.svelte';
	import { toast } from 'svelte-sonner';
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
				{(await listTodos()).length}
			</div>
		</header>

		<TodoCreateForm />

		<div
			class="group/card flex flex-col gap-0 divide-y divide-zinc-200 overflow-hidden rounded-4xl bg-card p-0 text-sm text-card-foreground shadow-md ring-1 ring-foreground/5"
		>
			{#each await listTodos() as todo (todo.id)}
				{#if todo.id < 0}
					<div class="flex items-center gap-2 px-3 py-2 opacity-70">
						<input class="size-4 shrink-0" type="checkbox" disabled aria-label="Toggle todo" />
						<span class="h-8 min-w-0 flex-1 rounded-md px-2 text-sm leading-8 text-zinc-950">
							{todo.title}
						</span>
						<span class="shrink-0 px-2 text-xs text-zinc-500">Saving</span>
					</div>
				{:else}
					<TodoRow
						{todo}
						setUndo={() =>
							toast(`Deleted ${todo.title}`, {
								action: {
									label: 'Undo',
									onClick: () => void restoreTodo(todo.id).updates(listTodos())
								}
							})}
					/>
				{/if}
			{:else}
				<p class="px-3 py-6 text-center text-sm text-zinc-500">No todos yet</p>
			{/each}
		</div>
	</section>
</main>
