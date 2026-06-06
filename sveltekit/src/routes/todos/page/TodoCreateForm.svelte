<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { listTodos, saveTodo } from '../../todos.remote';
	import { TODO_TITLE_MAX_LENGTH, saveTodoSchema } from '../schema';

	const todoSaveErrorsId = 'todo-save-errors';
</script>

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

		if (await form.submit().updates(listTodos().withOverride((items) => [todo, ...items]))) {
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
			aria-describedby={todoSaveErrorsId}
		/>
		<Button type="submit" disabled={saveTodo.pending > 0}>Add</Button>
	</div>

	<div id={todoSaveErrorsId} class="space-y-1">
		{#each saveTodo.fields.title.issues() as issue (issue.message)}
			<p class="text-sm text-red-600">{issue.message}</p>
		{/each}
	</div>
</form>
