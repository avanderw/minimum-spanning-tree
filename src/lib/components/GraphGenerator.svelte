<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { generateRandomGraph, PRESET_GRAPHS, type GraphGeneratorOptions } from '$lib/mst/graphGenerator';
	import type { Graph } from '$lib/mst/types';
	import { Settings, Shuffle, Download, Upload } from 'lucide-svelte';

	export let currentGraph: Graph;
	
	const dispatch = createEventDispatcher();

	let showGenerator = false;
	let generatorOptions: GraphGeneratorOptions = {
		vertexCount: 6,
		edgeDensity: 0.5,
		minWeight: 1,
		maxWeight: 10,
		seed: Math.floor(Math.random() * 1000)
	};

	function selectPresetGraph(presetName: string) {
		const graph = PRESET_GRAPHS[presetName];
		if (graph) {
			currentGraph = { ...graph };
			dispatch('graphChanged', currentGraph);
		}
	}

	function generateNewGraph() {
		try {
			const newGraph = generateRandomGraph(generatorOptions);
			currentGraph = newGraph;
			dispatch('graphChanged', currentGraph);
		} catch (error) {
			console.error('Error generating graph:', error);
			alert('Error generating graph. Please check your parameters.');
		}
	}

	function randomizeSeed() {
		generatorOptions.seed = Math.floor(Math.random() * 1000);
		generateNewGraph();
	}

	function exportGraph() {
		const dataStr = JSON.stringify(currentGraph, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'graph.json';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	function importGraph() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = (event) => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					try {
						const importedGraph = JSON.parse(e.target?.result as string);
						if (importedGraph.vertices && importedGraph.edges) {
							currentGraph = importedGraph;
							dispatch('graphChanged', currentGraph);
						} else {
							alert('Invalid graph format');
						}
					} catch (error) {
						alert('Error parsing graph file');
					}
				};
				reader.readAsText(file);
			}
		};
		input.click();
	}
</script>

<div class="graph-generator">
	<div class="header">
		<h3>Graph Generator</h3>
		<button 
			class="secondary outline" 
			on:click={() => showGenerator = !showGenerator}
			title="Toggle Settings"
		>
			<Settings size={16} />
		</button>
	</div>

	<div class="preset-graphs">
		<h4>Preset Graphs</h4>
		<div class="preset-buttons">
			{#each Object.keys(PRESET_GRAPHS) as presetName}
				<button
					class="outline"
					on:click={() => selectPresetGraph(presetName)}
					title="Load {presetName} graph"
				>
					{presetName.charAt(0).toUpperCase() + presetName.slice(1)}
				</button>
			{/each}
		</div>
	</div>

	{#if showGenerator}
		<div class="generator-settings">
			<h4>Random Graph Generator</h4>
			
			<div class="setting-group">
				<label for="vertices">Vertices: {generatorOptions.vertexCount}</label>
				<input
					id="vertices"
					type="range"
					min="3"
					max="15"
					bind:value={generatorOptions.vertexCount}
				/>
			</div>

			<div class="setting-group">
				<label for="density">Edge Density: {Math.round(generatorOptions.edgeDensity * 100)}%</label>
				<input
					id="density"
					type="range"
					min="0.2"
					max="1"
					step="0.1"
					bind:value={generatorOptions.edgeDensity}
				/>
			</div>

			<div class="weight-range">
				<div class="setting-group">
					<label for="minWeight">Min Weight</label>
					<input
						id="minWeight"
						type="number"
						min="1"
						max="20"
						bind:value={generatorOptions.minWeight}
					/>
				</div>
				<div class="setting-group">
					<label for="maxWeight">Max Weight</label>
					<input
						id="maxWeight"
						type="number"
						min="1"
						max="50"
						bind:value={generatorOptions.maxWeight}
					/>
				</div>
			</div>

			<div class="setting-group">
				<label for="seed">Seed (for reproducibility)</label>
				<div class="seed-input">
					<input
						id="seed"
						type="number"
						bind:value={generatorOptions.seed}
					/>
					<button 
						class="secondary outline"
						on:click={randomizeSeed}
						title="Generate new random seed"
					>
						<Shuffle size={14} />
					</button>
				</div>
			</div>

			<div class="generator-actions">
				<button 
					class="primary"
					on:click={generateNewGraph}
				>
					Generate Graph
				</button>
			</div>
		</div>
	{/if}

	<div class="graph-actions">
		<h4>Graph Actions</h4>
		<div class="action-buttons">
			<button 
				class="secondary outline"
				on:click={exportGraph}
				title="Export current graph"
			>
				<Download size={16} />
				Export
			</button>
			<button 
				class="secondary outline"
				on:click={importGraph}
				title="Import graph from file"
			>
				<Upload size={16} />
				Import
			</button>
		</div>
	</div>

	<div class="current-graph-info">
		<h4>Current Graph</h4>
		<div class="graph-stats">
			<div class="stat">
				<strong>Vertices:</strong> {currentGraph.vertices.length}
			</div>
			<div class="stat">
				<strong>Edges:</strong> {currentGraph.edges.length}
			</div>
			<div class="stat">
				<strong>Density:</strong> 
				{(currentGraph.edges.length / ((currentGraph.vertices.length * (currentGraph.vertices.length - 1)) / 2) * 100).toFixed(1)}%
			</div>
		</div>
	</div>
</div>

<style>
	.graph-generator {
		background: var(--card-background-color);
		border: 1px solid var(--muted-border-color);
		border-radius: 8px;
		padding: 1.5rem;
		margin: 1rem 0;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.header h3 {
		margin: 0;
	}

	.preset-graphs {
		margin-bottom: 1.5rem;
	}

	.preset-graphs h4 {
		margin-bottom: 0.75rem;
	}

	.preset-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.generator-settings {
		background: var(--secondary-background);
		border: 1px solid var(--muted-border-color);
		border-radius: 6px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.generator-settings h4 {
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.setting-group {
		margin-bottom: 1rem;
	}

	.setting-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.setting-group input[type="range"] {
		width: 100%;
	}

	.setting-group input[type="number"] {
		width: 100%;
		max-width: 120px;
	}

	.weight-range {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.seed-input {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.seed-input input {
		flex: 1;
	}

	.seed-input button {
		padding: 0.5rem;
		min-width: auto;
	}

	.generator-actions {
		margin-top: 1.5rem;
	}

	.generator-actions button {
		width: 100%;
	}

	.graph-actions {
		margin-bottom: 1.5rem;
	}

	.graph-actions h4 {
		margin-bottom: 0.75rem;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.action-buttons button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.current-graph-info {
		padding-top: 1rem;
		border-top: 1px solid var(--muted-border-color);
	}

	.current-graph-info h4 {
		margin-bottom: 0.75rem;
	}

	.graph-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
	}

	.stat {
		font-size: 0.9rem;
	}

	.stat strong {
		color: var(--primary);
	}

	@media (max-width: 768px) {
		.weight-range {
			grid-template-columns: 1fr;
		}
		
		.preset-buttons {
			flex-direction: column;
		}
		
		.action-buttons {
			flex-direction: column;
		}
	}
</style>
