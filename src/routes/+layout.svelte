<script lang="ts">
	import '@picocss/pico';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Minimum Spanning Tree Algorithms</title>
	<meta name="description" content="Interactive demonstration of MST algorithms including Prim's, Kruskal's, Borůvka's, and Reverse-Delete" />
</svelte:head>

{@render children?.()}
