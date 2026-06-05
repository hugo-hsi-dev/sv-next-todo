<script lang="ts">
	import { cn } from '$lib/utils';

	type Variant = 'default' | 'outline' | 'ghost' | 'destructive';
	type Size = 'default' | 'sm' | 'icon';

	let {
		class: className = '',
		variant = 'default',
		size = 'default',
		children,
		...rest
	}: {
		class?: string;
		variant?: Variant;
		size?: Size;
		children?: import('svelte').Snippet;
		[key: string]: unknown;
	} = $props();

	const variants: Record<Variant, string> = {
		default: 'bg-zinc-950 text-white hover:bg-zinc-800',
		outline: 'border border-zinc-300 bg-white hover:bg-zinc-100',
		ghost: 'hover:bg-zinc-100 hover:text-zinc-950',
		destructive: 'text-zinc-500 hover:bg-red-50 hover:text-red-700'
	};

	const sizes: Record<Size, string> = {
		default: 'h-9 px-3',
		sm: 'h-8 px-2',
		icon: 'h-8 w-8'
	};
</script>

<button
	class={cn(
		'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50',
		variants[variant],
		sizes[size],
		className
	)}
	{...rest}
>
	{@render children?.()}
</button>
