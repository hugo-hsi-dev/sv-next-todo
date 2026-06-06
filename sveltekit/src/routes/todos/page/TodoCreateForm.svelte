<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { createTodo, listTodoIds } from '../../todos.remote';
	import { createTodoSchema } from '../schema';

	const todoSaveErrorsId = 'todo-save-errors';
</script>

<form
	class="space-y-2"
	{...createTodo.preflight(createTodoSchema).enhance(async (form) => {
		if (await form.submit().updates(listTodoIds())) {
			form.element.reset();
		}
	})}
	oninput={() => createTodo.validate()}
>
	<div class="flex gap-2">
		<Input
			class="flex-1"
			{...createTodo.fields.title.as('text')}
			placeholder="Add todo"
			aria-describedby={todoSaveErrorsId}
		/>
		<Button type="submit" disabled={createTodo.pending > 0}>Add</Button>
	</div>

	<div id={todoSaveErrorsId} class="space-y-1">
		{#each createTodo.fields.title.issues() as issue (issue.message)}
			<p class="text-sm text-red-600">{issue.message}</p>
		{/each}
	</div>
</form>
