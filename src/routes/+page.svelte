<script lang="ts">
	import { onMount } from 'svelte';
	import { Play, RotateCcw, Settings, Info, GitBranch } from 'lucide-svelte';
	
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
</script>

<main class="container">
	<header>
		<h1>
			<GitBranch size={32} />
			Minimum Spanning Tree Algorithms
		</h1>
		<p>Interactive demonstration with step-by-step visualization</p>
	</header>

	<div class="main-content">
		<div class="left-panel">
			<section class="algorithm-selection">
				<h2>Algorithm Selection</h2>
				<div class="algorithm-grid">
					{#each algorithms as algorithm}
						<label class="algorithm-option">
							<input 
								type="radio" 
								bind:group={selectedAlgorithm} 
								value={algorithm.id}
								disabled={isRunning}
							/>
							<div class="algorithm-card">
								<strong>{algorithm.name}</strong>
								<small>{algorithm.description}</small>
							</div>
						</label>
					{/each}
				</div>
			</section>

			<section class="controls">
				<h2>Controls</h2>
				<div class="button-group">
					<button 
						class="contrast"
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
			</section>

			<GraphGenerator 
				bind:currentGraph={graph}
				on:graphChanged={handleGraphChanged}
			/>
		</div>

		<div class="right-panel">
			<section class="visualization">
				<h2>Graph Visualization</h2>
				<GraphVisualizer 
					{graph}
					mstEdges={currentMSTEdges}
					highlightedEdges={currentHighlightedEdges}
					currentStep={currentAnimationStep}
				/>
			</section>

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
		<section class="results">
			<article>
				<header>
					<h2>Results</h2>
					<h3>{algorithms.find(a => a.id === selectedAlgorithm)?.name}</h3>
				</header>
				<div class="result-content">
					<div class="result-stats">
						<div class="stat-card">
							<strong>Total Weight</strong>
							<span class="stat-value">{result.totalWeight || 'N/A'}</span>
						</div>
						<div class="stat-card">
							<strong>Edges in MST</strong>
							<span class="stat-value">{result.edges?.length || 0}</span>
						</div>
						<div class="stat-card">
							<strong>Execution Time</strong>
							<span class="stat-value">{result.executionTime?.toFixed(2) || 'N/A'} ms</span>
						</div>
					</div>
					
					{#if result.edges}
						<details class="mst-edges">
							<summary>MST Edges ({result.edges.length})</summary>
							<div class="edge-list">
								{#each result.edges as edge, index}
									<div class="edge-item">
										<span class="edge-number">{index + 1}.</span>
										<span class="edge-connection">{edge.from} ↔ {edge.to}</span>
										<span class="edge-weight">Weight: {edge.weight}</span>
									</div>
								{/each}
							</div>
						</details>
					{/if}
				</div>
			</article>
		</section>
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
	.main-content {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 2rem;
		margin: 2rem 0;
	}

	.left-panel {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.right-panel {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.algorithm-selection {
		background: var(--card-background-color);
		border: 1px solid var(--muted-border-color);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.algorithm-selection h2 {
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.algorithm-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.algorithm-option {
		cursor: pointer;
		margin: 0;
	}

	.algorithm-option input[type="radio"] {
		display: none;
	}

	.algorithm-card {
		padding: 1rem;
		border: 2px solid var(--muted-border-color);
		border-radius: 6px;
		background: var(--secondary-background);
		transition: all 0.2s ease;
	}

	.algorithm-card:hover {
		border-color: var(--primary);
		background: var(--primary-background);
	}

	.algorithm-option input[type="radio"]:checked + .algorithm-card {
		border-color: var(--primary);
		background: var(--primary-background);
		box-shadow: 0 0 0 1px var(--primary);
	}

	.algorithm-card strong {
		display: block;
		margin-bottom: 0.25rem;
		color: var(--primary);
	}

	.algorithm-card small {
		font-size: 0.85rem;
		color: var(--muted-color);
		line-height: 1.3;
	}

	.controls {
		background: var(--card-background-color);
		border: 1px solid var(--muted-border-color);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.controls h2 {
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.button-group button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 120px;
	}

	.visualization {
		background: var(--card-background-color);
		border: 1px solid var(--muted-border-color);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.visualization h2 {
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.results {
		margin: 2rem 0;
	}

	.results article {
		background: var(--card-background-color);
		border: 1px solid var(--muted-border-color);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.results header h2 {
		margin: 0 0 0.5rem 0;
	}

	.results header h3 {
		margin: 0 0 1.5rem 0;
		color: var(--primary);
		font-size: 1.1rem;
	}

	.result-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		background: var(--secondary-background);
		border: 1px solid var(--muted-border-color);
		border-radius: 6px;
		padding: 1rem;
		text-align: center;
	}

	.stat-card strong {
		display: block;
		font-size: 0.85rem;
		color: var(--muted-color);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--primary);
	}

	.mst-edges summary {
		cursor: pointer;
		font-weight: 500;
		padding: 0.75rem;
		background: var(--secondary-background);
		border-radius: 4px;
		margin-bottom: 0.75rem;
	}

	.edge-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.edge-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: var(--secondary-background);
		border-radius: 4px;
		font-family: monospace;
	}

	.edge-number {
		color: var(--muted-color);
		font-weight: bold;
		min-width: 2rem;
	}

	.edge-connection {
		font-weight: 500;
		flex: 1;
	}

	.edge-weight {
		color: var(--primary);
		font-weight: bold;
	}

	header h1 {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	footer {
		margin-top: 3rem;
		padding: 2rem 0;
		border-top: 1px solid var(--muted-border-color);
	}

	footer small {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		opacity: 0.7;
		line-height: 1.5;
	}

	@media (max-width: 1200px) {
		.main-content {
			grid-template-columns: 1fr;
		}
		
		.result-stats {
			grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		}
	}

	@media (max-width: 768px) {
		.button-group {
			flex-direction: column;
		}
		
		.button-group button {
			flex: none;
		}
	}
</style>
