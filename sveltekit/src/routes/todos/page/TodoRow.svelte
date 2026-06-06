<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import {
		deleteTodo,
		editTodo,
		getTodoDetails,
		listTodoIds,
		restoreTodo,
		toggleTodo
	} from '../../todos.remote';
	import { editTodoSchema } from '../schema';
	import { toast } from 'svelte-sonner';

	let { id }: { id: number } = $props();
	const titleErrorId = $props.id();
</script>

{#if await getTodoDetails(id)}
	<form
		class="flex items-start gap-2 px-3 py-2"
		{...editTodo
			.for(id)
			.preflight(editTodoSchema)
			.enhance(async (form) => {
				const title = form.fields.title.value()!;

				await form
					.submit()
					.updates(
						getTodoDetails(id).withOverride((todo) => ({ ...todo, title, updatedAt: new Date() }))
					);
			})}
		oninput={() => editTodo.for(id).validate()}
	>
		<input {...editTodo.for(id).fields.id.as('hidden', id)} />
		<Checkbox
			class="mt-2"
			checked={(await getTodoDetails(id)).completed}
			disabled={toggleTodo.pending > 0}
			onCheckedChange={(completed) =>
				void toggleTodo({ id, completed }).updates(
					getTodoDetails(id).withOverride((todo) => ({ ...todo, completed }))
				)}
			aria-label="Toggle todo"
		/>

		<div class="min-w-0 flex-1">
			<Input
				class={`h-8 border-transparent px-2 hover:border-zinc-200 ${(await getTodoDetails(id)).completed ? 'line-through' : ''}`}
				{...editTodo.for(id).fields.title.as('text', (await getTodoDetails(id)).title)}
				disabled={editTodo.for(id).pending > 0}
				aria-label="Todo title"
				aria-describedby={titleErrorId}
			/>

			<div id={titleErrorId} class="space-y-1 pt-1">
				{#each editTodo.for(id).fields.title.issues() as issue (issue.message)}
					<p class="text-sm text-red-600">{issue.message}</p>
				{/each}
			</div>
		</div>

		<Button
			class="shrink-0"
			variant="ghost"
			size="sm"
			type="submit"
			disabled={editTodo.for(id).pending > 0}
		>
			Save
		</Button>

		<Button
			class="shrink-0"
			variant="ghost"
			size="sm"
			type="button"
			disabled={deleteTodo.pending > 0}
			onclick={async () => {
				toast(`Deleted ${(await getTodoDetails(id)).title}`, {
					action: {
						label: 'Undo',
						onClick: () => void restoreTodo(id).updates(listTodoIds(), getTodoDetails(id))
					}
				});

				void deleteTodo(id).updates(
					listTodoIds().withOverride((ids) => ids.filter((todoId) => todoId !== id))
				);
			}}
		>
			Delete
		</Button>
	</form>
{/if}
