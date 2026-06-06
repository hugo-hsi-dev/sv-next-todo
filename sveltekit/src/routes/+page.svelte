<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { listTodoIds } from './todos.remote';
	import TodoCreateForm from './todos/page/TodoCreateForm.svelte';
	import TodoRow from './todos/page/TodoRow.svelte';
</script>

<svelte:head>
	<title>Todos</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-5 sm:px-6">
	<section class="space-y-4">
		<header class="border-b border-zinc-200 pb-3">
			<h1 class="text-xl font-semibold tracking-normal text-zinc-950">Todo</h1>
			<p class="text-sm text-zinc-500">Local single-user demo</p>
		</header>

		<div class="flex items-center justify-between">
			<Badge variant="outline">{(await listTodoIds()).length} active items</Badge>
		</div>

		<TodoCreateForm />

		<Card.Root class="gap-0 py-0">
			<Card.Content class="px-0">
				<div class="divide-y divide-zinc-100">
					{#each await listTodoIds() as id (id)}
						<TodoRow {id} />
					{:else}
						<p class="px-3 py-8 text-center text-sm text-zinc-500">No tasks</p>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</section>
</main>
