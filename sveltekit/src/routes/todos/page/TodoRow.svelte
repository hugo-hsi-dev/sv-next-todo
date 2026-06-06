<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import CheckIcon from 'phosphor-svelte/lib/Check';
	import PencilIcon from 'phosphor-svelte/lib/Pencil';
	import TrashIcon from 'phosphor-svelte/lib/Trash';
	import XIcon from 'phosphor-svelte/lib/X';
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
	let isEditing = $state(false);
	const titleErrorId = $props.id();
</script>

{#if await getTodoDetails(id)}
	{@const todo = await getTodoDetails(id)}
	<div class="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2">
		<Checkbox
			checked={todo.completed}
			disabled={toggleTodo.pending > 0}
			onCheckedChange={(completed) =>
				void toggleTodo({ id, completed }).updates(
					getTodoDetails(id).withOverride((todo) => ({ ...todo, completed }))
				)}
			aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
			title={todo.completed ? 'Mark incomplete' : 'Mark complete'}
		/>

		{#if isEditing}
			<form
				class="contents"
				{...editTodo
					.for(id)
					.preflight(editTodoSchema)
					.enhance(async (form) => {
						const title = form.fields.title.value()!;

						const result = await form
							.submit()
							.updates(
								getTodoDetails(id).withOverride((todo) => ({
									...todo,
									title,
									updatedAt: new Date()
								}))
							);

						if (result) {
							isEditing = false;
						}
					})}
				oninput={() => editTodo.for(id).validate()}
			>
				<input {...editTodo.for(id).fields.id.as('hidden', id)} />
				<div class="min-w-0 flex-1">
					<Input
						class="h-9 px-2"
						{...editTodo.for(id).fields.title.as('text', todo.title)}
						disabled={editTodo.for(id).pending > 0}
						aria-label="Todo title"
						aria-describedby={titleErrorId}
					/>

					{#if editTodo.for(id).fields.title.issues()?.length}
						<div id={titleErrorId} class="space-y-1 pt-1">
							{#each editTodo.for(id).fields.title.issues() ?? [] as issue (issue.message)}
								<p class="text-sm text-red-600">{issue.message}</p>
							{/each}
						</div>
					{/if}
				</div>

				<Button
					class="shrink-0"
					size="icon"
					type="submit"
					disabled={editTodo.for(id).pending > 0}
					aria-label="Save todo"
					title="Save"
				>
					<CheckIcon />
				</Button>

				<Button
					class="shrink-0"
					variant="outline"
					size="icon"
					type="button"
					aria-label="Cancel edit"
					title="Cancel"
					onclick={() => (isEditing = false)}
				>
					<XIcon />
				</Button>
			</form>
		{:else}
			<span
				class={`flex h-9 min-w-0 items-center truncate px-2 text-sm ${
					todo.completed ? 'text-zinc-400 line-through' : 'text-zinc-900'
				}`}
			>
				{todo.title}
			</span>
			<Button
				class="text-zinc-500"
				variant="ghost"
				size="icon"
				type="button"
				aria-label="Edit todo"
				title="Edit"
				onclick={() => (isEditing = true)}
			>
				<PencilIcon />
			</Button>

			<Button
				class="shrink-0"
				variant="destructive"
				size="icon"
				type="button"
				disabled={deleteTodo.pending > 0}
				aria-label="Delete todo"
				title="Delete"
				onclick={async () => {
					toast(`Deleted ${todo.title}`, {
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
				<TrashIcon />
			</Button>
		{/if}
	</div>
{/if}
