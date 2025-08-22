<script lang="ts">
	import { onMount } from 'svelte';
	import { Play, RotateCcw, Settings, Info, GitBranch, Sun, Moon } from 'lucide-svelte';
	
	// Import MST algorithms
	import { prim } from '$lib/mst/prim';
	import { kruskal } from '$lib/mst/kruskal';
	import { boruvka } from '$lib/mst/boruvka';
	import { reverseDelete } from '$lib/mst/reverseDelete';
	
	// Import components
	import GraphVisualizer from '$lib/components/GraphVisualizer.svelte';
	import AnimationController from '$lib/components/AnimationController.svelte';
	import GraphGenerator from '$lib/components/GraphGenerator.svelte';
	
	// Import types
	import type { Graph, MSTResult, AnimationStep } from '$lib/mst/types';

	let selectedAlgorithm = 'kruskal';
	let isRunning = false;
	let result: MSTResult | null = null;
	let animationSteps: AnimationStep[] = [];
	let currentAnimationStep = 0;
	let currentMSTEdges: any[] = [];
	let currentHighlightedEdges: any[] = [];

	// Theme management
	let isDarkMode = false;

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		const html = document.documentElement;
		
		if (isDarkMode) {
			html.setAttribute('data-theme', 'dark');
			localStorage.setItem('theme', 'dark');
		} else {
			html.setAttribute('data-theme', 'light');
			localStorage.setItem('theme', 'light');
		}
	}

	function initializeTheme() {
		const savedTheme = localStorage.getItem('theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		
		isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
		
		const html = document.documentElement;
		html.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
	}

	const algorithms = [
		{ id: 'prim', name: "Prim's Algorithm", description: 'Grows the MST one vertex at a time' },
		{ id: 'kruskal', name: "Kruskal's Algorithm", description: 'Sorts edges and adds them if they don\'t create cycles' },
		{ id: 'boruvka', name: "Borůvka's Algorithm", description: 'Finds minimum edge for each component simultaneously' },
		{ id: 'reverse-delete', name: "Reverse Delete Algorithm", description: 'Removes heaviest edges while keeping graph connected' }
	];

	// Default graph - using the textbook example
	let graph: Graph = {
		vertices: ['A', 'B', 'C', 'D', 'E'],
		edges: [
			{ from: 'A', to: 'B', weight: 4 },
			{ from: 'A', to: 'C', weight: 2 },
			{ from: 'B', to: 'C', weight: 1 },
			{ from: 'B', to: 'D', weight: 5 },
			{ from: 'C', to: 'D', weight: 8 },
			{ from: 'C', to: 'E', weight: 10 },
			{ from: 'D', to: 'E', weight: 2 }
		]
	};

	async function runAlgorithm() {
		isRunning = true;
		result = null;
		animationSteps = [];
		currentAnimationStep = 0;
		currentMSTEdges = [];
		currentHighlightedEdges = [];

		try {
			switch (selectedAlgorithm) {
				case 'prim':
					result = await prim(graph);
					break;
				case 'kruskal':
					result = await kruskal(graph);
					break;
				case 'boruvka':
					result = await boruvka(graph);
					break;
				case 'reverse-delete':
					result = await reverseDelete(graph);
					break;
			}
			
			if (result?.animationSteps) {
				animationSteps = result.animationSteps;
				console.log('🎬 MAIN DEBUG: Algorithm completed');
				console.log('📊 Steps array length:', result.steps?.length || 0);
				console.log('📊 AnimationSteps array length:', result.animationSteps?.length || 0);
				console.log('📋 Steps text:', result.steps);
				console.log('📋 Animation steps summary:', result.animationSteps.map((step, i) => `${i}: ${step.action} - ${step.description}`));
				updateVisualization(0);
			}
		} catch (error) {
			console.error('Algorithm error:', error);
		} finally {
			isRunning = false;
		}
	}

	function resetDemo() {
		result = null;
		isRunning = false;
		animationSteps = [];
		currentAnimationStep = 0;
		currentMSTEdges = [];
		currentHighlightedEdges = [];
	}

	function updateVisualization(stepIndex: number) {
		if (animationSteps.length === 0) return;
		
		currentAnimationStep = stepIndex;
		const step = animationSteps[stepIndex];
		
		if (step) {
			console.log(`� ANIMATION: Step ${stepIndex + 1}/${animationSteps.length} - ${step.action} - ${step.description}`);
			
			currentMSTEdges = [...step.mstEdges];
			currentHighlightedEdges = [...step.highlightedEdges];
		}
	}

	function handleGraphChanged(event: CustomEvent<Graph>) {
		graph = event.detail;
		resetDemo();
	}

	function handleAnimationStep(event: CustomEvent<number>) {
		updateVisualization(event.detail);
	}

	onMount(() => {
		initializeTheme();
	});
</script>

<main class="container">
	<header>
		<div class="header-content">
			<div>
				<h1>
					<GitBranch size={32} />
					Minimum Spanning Tree Algorithms
				</h1>
				<p>Interactive demonstration with step-by-step visualization</p>
			</div>
			<div class="theme-toggle">
				<button 
					class="secondary"
					on:click={toggleTheme}
					title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
				>
					{#if isDarkMode}
						<Sun size={18} />
						Light
					{:else}
						<Moon size={18} />
						Dark
					{/if}
				</button>
			</div>
		</div>
	</header>

	<div class="grid">
		<div>
			<article>
				<header>
					<h2>Algorithm Selection</h2>
				</header>
				<fieldset>
					{#each algorithms as algorithm}
						<label>
							<input 
								type="radio" 
								name="algorithm"
								bind:group={selectedAlgorithm} 
								value={algorithm.id}
								disabled={isRunning}
							/>
							<strong>{algorithm.name}</strong>
							<small>{algorithm.description}</small>
						</label>
					{/each}
				</fieldset>
			</article>

			<article>
				<header>
					<h2>Controls</h2>
				</header>
				{#if selectedAlgorithm}
					<p>
						<strong>Selected:</strong> 
						<mark>
							{algorithms.find(a => a.id === selectedAlgorithm)?.name || 'None'}
						</mark>
					</p>
				{/if}
				<div class="grid">
					<button 
						on:click={runAlgorithm}
						disabled={isRunning}
						aria-busy={isRunning}
					>
						<Play size={18} />
						{isRunning ? 'Running...' : 'Run Algorithm'}
					</button>
					<button 
						class="secondary"
						on:click={resetDemo}
						disabled={isRunning}
					>
						<RotateCcw size={18} />
						Reset
					</button>
				</div>
			</article>

			<GraphGenerator 
				bind:currentGraph={graph}
				on:graphChanged={handleGraphChanged}
			/>
		</div>

		<div>
			<article>
				<header>
					<h2>Graph Visualization</h2>
				</header>
				<GraphVisualizer 
					{graph}
					mstEdges={currentMSTEdges}
					highlightedEdges={currentHighlightedEdges}
					currentStep={currentAnimationStep}
				/>
			</article>

			{#if result?.animationSteps}
				<AnimationController 
					steps={result.animationSteps.map(step => step.description)}
					bind:currentStep={currentAnimationStep}
					on:step={handleAnimationStep}
				/>
			{/if}
		</div>
	</div>

	{#if result}
		<article>
			<header>
				<h2>Results - {algorithms.find(a => a.id === selectedAlgorithm)?.name}</h2>
			</header>
			<div class="grid">
				<div>
					<strong>Total Weight</strong>
					<p>{result.totalWeight || 'N/A'}</p>
				</div>
				<div>
					<strong>Edges in MST</strong>
					<p>{result.edges?.length || 0}</p>
				</div>
				<div>
					<strong>Execution Time</strong>
					<p>{result.executionTime?.toFixed(2) || 'N/A'} ms</p>
				</div>
			</div>
			
			{#if result.edges}
				<details>
					<summary>MST Edges ({result.edges.length})</summary>
					<ul>
						{#each result.edges as edge, index}
							<li>
								<strong>{index + 1}.</strong>
								{edge.from} ↔ {edge.to} 
								<small>(Weight: {edge.weight})</small>
							</li>
						{/each}
					</ul>
				</details>
			{/if}
		</article>
	{/if}

	<footer>
		<small>
			<Info size={16} />
			This interactive demo showcases three different approaches to finding the Minimum Spanning Tree. 
			Use the animation controls to step through each algorithm's execution.
		</small>
	</footer>
</main>

<style>
	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-content h1 {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.theme-toggle {
		flex-shrink: 0;
	}

	.theme-toggle button {
		margin: 0;
	}

	footer small {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		opacity: 0.7;
		line-height: 1.5;
	}

	button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			align-items: stretch;
		}
		
		.theme-toggle {
			align-self: flex-end;
		}
	}
</style>
