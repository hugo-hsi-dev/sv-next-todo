<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { deleteTodo, listTodos, saveTodo, toggleTodo } from '../../todos.remote';
	import { TODO_TITLE_MAX_LENGTH, saveTodoSchema } from '../schema';
	import type { TodoItem } from '../type';

	let {
		todo,
		setUndo
	}: {
		todo: TodoItem;
		setUndo: () => void;
	} = $props();

	let editForm = $derived(saveTodo.for(todo.id));
	let titleErrorId = $derived(`todo-${todo.id}-title-error`);
	let deleting = $state(false);
	let toggling = $state(false);

	async function save(
		form: Omit<typeof editForm, 'enhance' | 'element'> & { element: HTMLFormElement }
	) {
		const title = form.fields.title.value()!;

		await form
			.submit()
			.updates(
				listTodos().withOverride((items: TodoItem[]) =>
					items.map((item) =>
						item.id === todo.id ? { ...item, title, updatedAt: new Date() } : item
					)
				)
			);
	}

	async function toggle(completed: boolean) {
		toggling = true;
		try {
			await toggleTodo({ id: todo.id, completed }).updates(
				listTodos().withOverride((items: TodoItem[]) =>
					items.map((item) => (item.id === todo.id ? { ...item, completed } : item))
				)
			);
		} finally {
			toggling = false;
		}
	}

	async function deleteAndUndo() {
		setUndo();
		deleting = true;
		try {
			await deleteTodo(todo.id).updates(
				listTodos().withOverride((items: TodoItem[]) => items.filter(({ id }) => id !== todo.id))
			);
		} finally {
			deleting = false;
		}
	}
</script>

<form
	class="flex items-start gap-2 px-3 py-2"
	{...editForm.preflight(saveTodoSchema).enhance(save)}
	oninput={() => editForm.validate()}
>
	<input {...editForm.fields.id.as('hidden', todo.id)} />
	<input
		class="mt-2 size-4 shrink-0"
		type="checkbox"
		checked={todo.completed}
		disabled={toggling}
		onchange={(event) => toggle(event.currentTarget.checked)}
		aria-label="Toggle todo"
	/>

	<div class="min-w-0 flex-1">
		<Input
			class={`h-8 border-transparent px-2 hover:border-zinc-200 ${todo.completed ? 'line-through' : ''}`}
			{...editForm.fields.title.as('text', todo.title)}
			maxlength={TODO_TITLE_MAX_LENGTH}
			disabled={editForm.pending > 0}
			aria-label="Todo title"
			aria-describedby={titleErrorId}
		/>

		<div id={titleErrorId} class="space-y-1 pt-1">
			{#each editForm.fields.title.issues() as issue (issue.message)}
				<p class="text-sm text-red-600">{issue.message}</p>
			{/each}
		</div>
	</div>

	<Button class="shrink-0" variant="ghost" size="sm" type="submit" disabled={editForm.pending > 0}>
		Save
	</Button>

	<Button
		class="shrink-0"
		variant="ghost"
		size="sm"
		type="button"
		disabled={deleting}
		onclick={deleteAndUndo}
	>
		Delete
	</Button>
</form>
