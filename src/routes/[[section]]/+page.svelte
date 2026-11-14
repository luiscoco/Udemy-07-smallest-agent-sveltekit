<script lang="ts">
  import AgentApp from '#lib/AgentApp.svelte';
  let { data }: { data: { section: string } } = $props();
</script>
<svelte:head><title>The Smallest Agent · SvelteKit + TypeScript</title><meta name="description" content="Run your first Claude agent and explore the SvelteKit architecture, source code and UML workflow." /></svelte:head>
<AgentApp section={data.section} />
