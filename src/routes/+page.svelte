<script lang="ts">
	import { onMount } from 'svelte';
	import { GitBranch, Sun, Moon } from 'lucide-svelte';
	
	// Import MST algorithms
	import { prim } from '$lib/mst/prim';
	import { kruskal } from '$lib/mst/kruskal';
	import { boruvka } from '$lib/mst/boruvka';
	import { reverseDelete } from '$lib/mst/reverseDelete';
	
	// Import components
	import GraphVisualizer from '$lib/components/GraphVisualizer.svelte';
	
	// Import types
	import type { Graph, MSTResult, AnimationStep } from '$lib/mst/types';

	let selectedAlgorithm = 'kruskal';
	let isRunning = false;
	let result: MSTResult | null = null;
	let animationSteps: AnimationStep[] = [];
	let currentAnimationStep = 0;
	let currentMSTEdges: any[] = [];
	let currentHighlightedEdges: any[] = [];

	// Graph presets
	const graphPresets = [
		{ id: 'simple', name: 'Simple', graph: {
			vertices: ['A', 'B', 'C', 'D'],
			edges: [
				{ from: 'A', to: 'B', weight: 1 },
				{ from: 'B', to: 'C', weight: 2 },
				{ from: 'C', to: 'D', weight: 3 },
				{ from: 'A', to: 'D', weight: 4 }
			]
		}},
		{ id: 'textbook', name: 'Textbook', graph: {
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
		}},
		{ id: 'complex', name: 'Complex', graph: {
			vertices: ['A', 'B', 'C', 'D', 'E', 'F'],
			edges: [
				{ from: 'A', to: 'B', weight: 7 },
				{ from: 'A', to: 'C', weight: 9 },
				{ from: 'A', to: 'F', weight: 14 },
				{ from: 'B', to: 'C', weight: 10 },
				{ from: 'B', to: 'D', weight: 15 },
				{ from: 'C', to: 'D', weight: 11 },
				{ from: 'C', to: 'F', weight: 2 },
				{ from: 'D', to: 'E', weight: 6 },
				{ from: 'E', to: 'F', weight: 9 }
			]
		}}
	];

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
		{ id: 'kruskal', name: "Kruskal's Algorithm", description: 'Sorts edges and adds them if they don\'t create cycles' },
		{ id: 'prim', name: "Prim's Algorithm", description: 'Grows the MST one vertex at a time' },
		{ id: 'boruvka', name: "Borůvka's Algorithm", description: 'Finds minimum edge for each component simultaneously' },
		{ id: 'reverse-delete', name: "Reverse Delete Algorithm", description: 'Removes heaviest edges while keeping graph connected' }
	];

	// Default graph - using the textbook example
	let graph: Graph = graphPresets[1].graph;

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

	function selectGraph(presetId: string) {
		const preset = graphPresets.find(p => p.id === presetId);
		if (preset) {
			graph = preset.graph;
			// Reset and run algorithm automatically
			resetDemo();
			runAlgorithmAndStartAnimation();
		}
	}

	async function runAlgorithmAndStartAnimation() {
		await runAlgorithm();
		// Animation will start automatically via the autoStart prop in GraphVisualizer
	}

	// Auto-run algorithm when selection changes
	$: if (selectedAlgorithm) {
		resetDemo();
		runAlgorithmAndStartAnimation();
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

	function handleAnimationStep(event: CustomEvent<number>) {
		updateVisualization(event.detail);
	}

	onMount(() => {
		initializeTheme();
		// Run the initial algorithm
		runAlgorithmAndStartAnimation();
	});
</script>

<header class="container">
	<div class="header-content">
		<div>
			<h1>
				<GitBranch size={32} />
				Minimum Spanning Tree Algorithms
			</h1>
		</div>
		<div class="theme-toggle">
			<button 
				class="secondary compact-theme-btn"
				on:click={toggleTheme}
				title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
			>
				{#if isDarkMode}
					<Sun size={16} />
				{:else}
					<Moon size={16} />
				{/if}
			</button>
		</div>
	</div>
</header>

<main class="container">

	<div class="grid">
		<div>
			<article>
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
				
				{#if result && !isRunning}
					<div class="results-compact">
						<div class="result-stats">
							<div class="stat">
								<span class="stat-value">{result.totalWeight || 'N/A'}</span>
								<span class="stat-label">weight</span>
							</div>
							<div class="stat">
								<span class="stat-value">{result.edges?.length || 0}</span>
								<span class="stat-label">edges</span>
							</div>
							<div class="stat">
								<span class="stat-value">{result.executionTime?.toFixed(1) || 'N/A'}ms</span>
								<span class="stat-label">time</span>
							</div>
						</div>
					</div>
				{:else if isRunning}
					<div class="results-compact running">
						<div class="loading-indicator">
							<div class="spinner"></div>
							<span>Running...</span>
						</div>
					</div>
				{/if}

				<div class="graph-controls">
					<h4>Graph Presets</h4>
					<div class="preset-buttons">
						{#each graphPresets as preset}
							<button 
								class="outline {graph === preset.graph ? 'active-preset' : ''}"
								on:click={() => selectGraph(preset.id)}
								disabled={isRunning}
							>
								{preset.name}
							</button>
						{/each}
					</div>
				</div>
			</article>
		</div>

		<div>
			<article>
				<GraphVisualizer 
					{graph}
					mstEdges={currentMSTEdges}
					highlightedEdges={currentHighlightedEdges}
					currentStep={currentAnimationStep}
					animationSteps={result?.animationSteps || []}
					autoStart={true}
					on:step={handleAnimationStep}
				/>
			</article>
		</div>
	</div>

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

	.compact-theme-btn {
		min-width: 2.5rem !important;
		height: 2.5rem !important;
		padding: 0.5rem !important;
		border-radius: 50% !important;
		justify-content: center !important;
	}

	button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.results-compact {
		margin-top: 1rem;
		padding: 0.75rem;
		background: var(--pico-card-background-color, #f8fafc);
		border: 1px solid var(--pico-muted-border-color, #e5e7eb);
		border-radius: 6px;
	}

	.results-compact.running {
		text-align: center;
	}

	.result-stats {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.result-stats .stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		min-width: 60px;
	}

	.result-stats .stat-value {
		font-size: 1rem;
		font-weight: 700;
		color: var(--pico-primary, #3b82f6);
		line-height: 1.1;
	}

	.result-stats .stat-label {
		font-size: 0.65rem;
		color: var(--pico-muted-color, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.025em;
		margin-top: 0.15rem;
	}

	.loading-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--pico-muted-color, #6b7280);
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid var(--pico-muted-border-color, #e5e7eb);
		border-top: 2px solid var(--pico-primary, #3b82f6);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.graph-controls {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--pico-muted-border-color, #e5e7eb);
	}

	.graph-controls h4 {
		margin: 0 0 0.75rem 0;
		font-size: 0.9rem;
		color: var(--pico-color, #374151);
	}

	.preset-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.preset-buttons button {
		flex: 1;
	}

	.preset-buttons button.active-preset {
		background: var(--pico-primary, #3b82f6);
		border-color: var(--pico-primary, #3b82f6);
		color: #ffffff;
	}

	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			align-items: stretch;
		}
		
		.theme-toggle {
			align-self: flex-end;
		}

		.result-stats {
			gap: 1rem;
		}

		.preset-buttons {
			flex-direction: column;
		}
	}
</style>
