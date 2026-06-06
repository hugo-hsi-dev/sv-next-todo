<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import PlusIcon from 'phosphor-svelte/lib/Plus';
	import { createTodo, listTodoIds } from '../../todos.remote';
	import { createTodoSchema } from '../schema';

	const todoSaveErrorsId = $props.id();
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
			placeholder="New task"
			aria-describedby={todoSaveErrorsId}
		/>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						class="shrink-0"
						type="submit"
						size="icon-lg"
						disabled={createTodo.pending > 0}
						aria-label="Add todo"
					>
						<PlusIcon />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>Add</Tooltip.Content>
		</Tooltip.Root>
	</div>

	<div id={todoSaveErrorsId} class="space-y-1">
		{#each createTodo.fields.title.issues() as issue (issue.message)}
			<p class="text-sm text-red-600">{issue.message}</p>
		{/each}
	</div>
</form>
