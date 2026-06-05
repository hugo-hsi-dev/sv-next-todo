<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		class: className = '',
		children,
		...rest
	}: { class?: string; children?: import('svelte').Snippet; [key: string]: unknown } = $props();
</script>

<section
	class={cn('overflow-hidden rounded-md border border-zinc-200 bg-white', className)}
	{...rest}
>
	{@render children?.()}
</section>
