<script lang="ts">
	import { cn } from '$lib/utils';

	let { class: className = '', ...rest }: { class?: string; [key: string]: unknown } = $props();
</script>

<input
	class={cn(
		'h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 transition outline-none focus:border-zinc-950 disabled:text-zinc-400',
		className
	)}
	{...rest}
/>
