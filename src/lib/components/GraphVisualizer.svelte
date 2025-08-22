<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-svelte';
	import type { Graph, Edge, AnimationStep } from '$lib/mst/types';

	export let graph: Graph;
	export let mstEdges: Edge[] = [];
	export let highlightedEdges: Edge[] = [];
	export let currentStep = 0;
	export let animationSteps: AnimationStep[] = [];
	export let animationSpeed = 1000; // ms between steps
	export let autoStart = false; // New prop to control auto-start

	const dispatch = createEventDispatcher();

	let svgElement: SVGElement;
	let positions: Record<string, { x: number; y: number }> = {};
	let isPlaying = false;
	let intervalId: number | null = null;
	let svgWidth = 600;
	let svgHeight = 400;
	let hasAutoStarted = false; // Prevent multiple auto-starts
	
	const VERTEX_RADIUS = 20;
	const ANIMATION_DURATION = 300;

	// Generate positions for vertices in a circle
	function generatePositions() {
		let width = svgWidth;
		let height = svgHeight;
		
		if (svgElement) {
			const rect = svgElement.getBoundingClientRect();
			width = rect.width || 600;
			height = rect.height || 400;
			svgWidth = width;
			svgHeight = height;
		}
		
		const centerX = width / 2;
		const centerY = height / 2;
		const radius = Math.min(width, height) * 0.35;
		
		positions = {};
		const angleStep = (2 * Math.PI) / graph.vertices.length;
		
		graph.vertices.forEach((vertex, index) => {
			const angle = index * angleStep - Math.PI / 2; // Start from top
			positions[vertex] = {
				x: centerX + radius * Math.cos(angle),
				y: centerY + radius * Math.sin(angle)
			};
		});
	}

	// Check if an edge is in the MST
	function isInMST(edge: Edge): boolean {
		const result = mstEdges.some(mstEdge => {
			// Check both directions and compare all properties
			return (mstEdge.from === edge.from && mstEdge.to === edge.to && mstEdge.weight === edge.weight) ||
			       (mstEdge.from === edge.to && mstEdge.to === edge.from && mstEdge.weight === edge.weight);
		});
		return result;
	}

	// Check if an edge is currently highlighted
	function isHighlighted(edge: Edge): boolean {
		const result = highlightedEdges.some(highlightEdge => {
			// Check both directions and compare all properties
			return (highlightEdge.from === edge.from && highlightEdge.to === edge.to && highlightEdge.weight === edge.weight) ||
			       (highlightEdge.from === edge.to && highlightEdge.to === edge.from && highlightEdge.weight === edge.weight);
		});
		return result;
	}

	// Debug visualization state changes  
	$: if (mstEdges || highlightedEdges || currentStep !== undefined) {
		console.log(`🎨 VISUALIZER: Step ${currentStep} - MST: ${mstEdges?.length || 0} edges, Highlighted: ${highlightedEdges?.length || 0} edges`);
	}

	// Get edge class for styling
	function getEdgeClass(edge: Edge): string {
		const highlighted = isHighlighted(edge);
		const inMST = isInMST(edge);
		
		if (highlighted) return 'edge highlighted';
		if (inMST) return 'edge mst';
		return 'edge';
	}

	// Calculate edge path
	function getEdgePath(edge: Edge): string {
		const start = positions[edge.from];
		const end = positions[edge.to];
		
		if (!start || !end) return '';
		
		// Calculate the angle and offset points to avoid overlapping with vertices
		const dx = end.x - start.x;
		const dy = end.y - start.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const unitX = dx / distance;
		const unitY = dy / distance;
		
		const startX = start.x + unitX * VERTEX_RADIUS;
		const startY = start.y + unitY * VERTEX_RADIUS;
		const endX = end.x - unitX * VERTEX_RADIUS;
		const endY = end.y - unitY * VERTEX_RADIUS;
		
		return `M ${startX} ${startY} L ${endX} ${endY}`;
	}

	// Calculate label position for edge weight
	function getLabelPosition(edge: Edge): { x: number; y: number } {
		const start = positions[edge.from];
		const end = positions[edge.to];
		
		if (!start || !end) return { x: 0, y: 0 };
		
		return {
			x: (start.x + end.x) / 2,
			y: (start.y + end.y) / 2
		};
	}

	// Animation control functions - simplified and cleaned up
	function cleanupInterval() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	function play() {
		if (animationSteps.length === 0) return;
		
		// If at the end, restart from beginning
		if (currentStep >= animationSteps.length - 1) {
			currentStep = 0;
			dispatch('step', currentStep);
		}
		
		isPlaying = true;
		cleanupInterval();
		
		intervalId = setInterval(() => {
			if (currentStep < animationSteps.length - 1) {
				currentStep += 1;
				dispatch('step', currentStep);
			} else {
				// Animation completed
				pause();
			}
		}, animationSpeed);
	}

	function pause() {
		isPlaying = false;
		cleanupInterval();
	}

	function stop() {
		pause();
		if (animationSteps.length > 0) {
			currentStep = 0;
			dispatch('step', currentStep);
		}
	}

	function nextStep() {
		if (animationSteps.length === 0) return;
		
		pause(); // Stop any running animation
		if (currentStep < animationSteps.length - 1) {
			currentStep += 1;
			dispatch('step', currentStep);
		}
	}

	function prevStep() {
		if (animationSteps.length === 0) return;
		
		pause(); // Stop any running animation
		if (currentStep > 0) {
			currentStep -= 1;
			dispatch('step', currentStep);
		}
	}

	function goToStep(step: number) {
		if (animationSteps.length === 0) return;
		
		pause(); // Stop any running animation
		const newStep = Math.max(0, Math.min(animationSteps.length - 1, step));
		if (newStep !== currentStep) {
			currentStep = newStep;
			dispatch('step', currentStep);
		}
	}

	function togglePlayPause() {
		if (isPlaying) {
			pause();
		} else {
			play();
		}
	}

	// Clean up interval on component destroy
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		cleanupInterval();
	});

	onMount(() => {
		// Initial positioning - generate immediately with default dimensions
		generatePositions();
		
		// Also try after a short delay in case SVG isn't ready
		setTimeout(() => {
			generatePositions();
		}, 10);
		
		// Handle window resize
		const handleResize = () => {
			setTimeout(() => {
				generatePositions();
			}, 100);
		};
		
		window.addEventListener('resize', handleResize);
		
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	// Regenerate positions when graph changes
	$: if (graph) {
		generatePositions(); // Immediate generation
		if (svgElement) {
			setTimeout(() => {
				generatePositions();
			}, 10);
		}
	}

	// Reset auto-start flag when animationSteps change
	$: if (animationSteps) {
		hasAutoStarted = false;
		pause(); // Stop any running animation when steps change
	}

	// Auto-start animation when animationSteps change and autoStart is true
	$: if (autoStart && animationSteps.length > 0 && !hasAutoStarted) {
		hasAutoStarted = true;
		// Small delay to ensure everything is ready
		setTimeout(() => {
			if (animationSteps.length > 0) {
				currentStep = 0;
				dispatch('step', currentStep);
				setTimeout(() => {
					if (!isPlaying && animationSteps.length > 0) {
						play();
					}
				}, 100);
			}
		}, 300);
	}
</script>

<div class="graph-visualizer">
	<div class="graph-stats">
		<h4>Graph Statistics</h4>
		<div class="stats-grid">
			<div class="stat">
				<span class="stat-value">{graph.vertices.length}</span>
				<span class="stat-label">vertices</span>
			</div>
			<div class="stat">
				<span class="stat-value">{graph.edges.length}</span>
				<span class="stat-label">edges</span>
			</div>
			<div class="stat">
				<span class="stat-value">{((graph.edges.length / ((graph.vertices.length * (graph.vertices.length - 1)) / 2)) * 100).toFixed(0)}%</span>
				<span class="stat-label">density</span>
			</div>
		</div>
	</div>

	<div class="svg-container">
		<svg bind:this={svgElement} viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet">
			<!-- Grid background with theme-responsive colors -->
			<defs>
				<pattern id="grid-light" width="20" height="20" patternUnits="userSpaceOnUse">
					<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#d1d5db" stroke-width="0.8" opacity="0.6"/>
				</pattern>
				<pattern id="grid-dark" width="20" height="20" patternUnits="userSpaceOnUse">
					<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#6b7280" stroke-width="0.8" opacity="0.4"/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid-light)" class="grid-bg" />
			
			<!-- Edges -->
			<g class="edges">
				{#each graph.edges as edge, i (edge.from + edge.to + edge.weight + mstEdges.length + highlightedEdges.length)}
					<g class="edge-group">
						<!-- Edge line -->
						<path
							d={getEdgePath(edge)}
							class={getEdgeClass(edge)}
						/>
						
						<!-- Edge weight label -->
						{#if positions[edge.from] && positions[edge.to]}
							{@const labelPos = getLabelPosition(edge)}
							<circle 
								cx={labelPos.x} 
								cy={labelPos.y} 
								r="12" 
								class="weight-bg"
							/>
							<text 
								x={labelPos.x} 
								y={labelPos.y} 
								class="weight-label"
								text-anchor="middle" 
								dominant-baseline="central"
							>
								{edge.weight}
							</text>
						{/if}
					</g>
				{/each}
			</g>
			
			<!-- Vertices -->
			<g class="vertices">
				{#each graph.vertices as vertex}
					{#if positions[vertex]}
						<g class="vertex-group">
							<circle 
								cx={positions[vertex].x} 
								cy={positions[vertex].y} 
								r={VERTEX_RADIUS}
								class="vertex"
							/>
							<text 
								x={positions[vertex].x} 
								y={positions[vertex].y}
								class="vertex-label"
								text-anchor="middle" 
								dominant-baseline="central"
							>
								{vertex}
							</text>
						</g>
					{/if}
				{/each}
			</g>
		</svg>
	</div>

	{#if animationSteps.length > 0}
		<div class="animation-controls">
			<div class="controls-row">
				<div class="step-info">
					<span class="step-counter">Step {currentStep + 1} of {animationSteps.length}</span>
				</div>
				<div class="control-buttons">
					<button 
						class="secondary outline compact"
						on:click|preventDefault={prevStep} 
						disabled={currentStep === 0 || animationSteps.length === 0}
						title="Previous Step"
					>
						<SkipBack size={14} />
					</button>
					<button 
						class="compact {isPlaying ? 'secondary' : ''}"
						on:click|preventDefault={togglePlayPause}
						disabled={animationSteps.length === 0}
						title={isPlaying ? 'Pause' : 'Play'}
					>
						{#if isPlaying}
							<Pause size={14} />
						{:else}
							<Play size={14} />
						{/if}
					</button>
					<button 
						class="secondary outline compact"
						on:click|preventDefault={nextStep} 
						disabled={currentStep >= animationSteps.length - 1 || animationSteps.length === 0}
						title="Next Step"
					>
						<SkipForward size={14} />
					</button>
					<button 
						class="secondary outline compact"
						on:click|preventDefault={stop}
						disabled={animationSteps.length === 0}
						title="Reset to Start"
					>
						<RotateCcw size={14} />
					</button>
				</div>
			</div>
			<div class="current-step-info">
				<small>{animationSteps[currentStep]?.description || 'No description'}</small>
			</div>
		</div>
	{/if}
</div>

<style>
	.graph-visualizer {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.graph-stats {
		background: var(--pico-card-background-color, #f8fafc);
		border: 1px solid var(--pico-muted-border-color, #e5e7eb);
		border-radius: 6px;
		padding: 0.75rem;
	}

	.graph-stats h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--pico-color, #374151);
		text-align: center;
	}

	.stats-grid {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		min-width: 60px;
	}

	.stat-value {
		font-size: 1rem;
		font-weight: 700;
		color: var(--pico-primary, #3b82f6);
		line-height: 1.1;
	}

	.stat-label {
		font-size: 0.65rem;
		color: var(--pico-muted-color, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.025em;
		margin-top: 0.15rem;
	}

	.svg-container {
		display: flex;
		justify-content: center;
		background: var(--pico-card-background-color, #ffffff);
		border: 1px solid var(--pico-muted-border-color, #e5e7eb);
		border-radius: 8px;
		padding: 1rem;
	}

	svg {
		width: 100%;
		height: auto;
		aspect-ratio: 3/2;
		border: 1px solid var(--pico-muted-border-color, #e5e7eb);
		border-radius: 6px;
		background: var(--pico-card-background-color, #ffffff);
	}

	/* Theme-responsive grid background */
	:global([data-theme="light"]) svg .grid-bg {
		fill: url(#grid-light);
	}

	:global([data-theme="dark"]) svg .grid-bg {
		fill: url(#grid-dark);
	}

	/* Default to light theme if no data-theme attribute */
	svg .grid-bg {
		fill: url(#grid-light);
	}

	.animation-controls {
		background: var(--pico-card-background-color, #f8fafc);
		border: 1px solid var(--pico-muted-border-color, #e5e7eb);
		border-radius: 6px;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.controls-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.step-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.step-counter {
		font-size: 0.8rem;
		color: var(--pico-muted-color, #6b7280);
		font-weight: 500;
		white-space: nowrap;
	}

	.control-buttons {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}

	.control-buttons button.compact {
		min-width: 2rem;
		height: 2rem;
		padding: 0.25rem;
		margin: 0;
		font-size: 0;
	}

	.current-step-info {
		background: var(--pico-card-background-color, rgba(59, 130, 246, 0.05));
		border: 1px solid var(--pico-muted-border-color, #e5e7eb);
		border-left: 3px solid var(--pico-primary, #3b82f6);
		border-radius: 0 4px 4px 0;
		padding: 0.5rem;
		text-align: center;
	}

	.current-step-info small {
		font-size: 0.75rem;
		line-height: 1.3;
		color: var(--pico-color, #374151);
		font-style: italic;
	}

	svg .edge {
		stroke: var(--pico-muted-color, #6b7280);
		stroke-width: 2;
		fill: none;
		transition: all 0.5s ease;
	}

	svg .edge.mst {
		stroke: #22c55e !important;
		stroke-width: 4 !important;
		filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.5));
	}

	svg .edge.highlighted {
		stroke: #f59e0b !important;
		stroke-width: 5 !important;
		stroke-dasharray: 8,4;
		animation: dash 1.5s linear infinite, glow 2s ease-in-out infinite alternate;
		filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.8));
	}

	@keyframes dash {
		to {
			stroke-dashoffset: -12;
		}
	}

	@keyframes glow {
		0% {
			stroke-width: 5;
			filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.8));
		}
		100% {
			stroke-width: 6;
			filter: drop-shadow(0 0 10px rgba(245, 158, 11, 1));
		}
	}

	@keyframes pulse {
		0% { opacity: 0.8; }
		100% { opacity: 1; }
	}

	.vertex {
		fill: var(--pico-card-background-color, #ffffff);
		stroke: var(--pico-primary, #3b82f6);
		stroke-width: 3;
		transition: all 0.3s ease;
		filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));
	}

	.vertex-label {
		fill: var(--pico-primary, #3b82f6);
		font-weight: bold;
		font-size: 14px;
		pointer-events: none;
	}

	.weight-bg {
		fill: var(--pico-card-background-color, #ffffff);
		stroke: var(--pico-muted-border-color, #e5e7eb);
		stroke-width: 1;
	}

	.weight-label {
		fill: var(--pico-color, #374151);
		font-size: 11px;
		font-weight: bold;
		pointer-events: none;
	}

	/* Dark theme specific adjustments */
	:global([data-theme="dark"]) .vertex {
		filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.4));
	}

	:global([data-theme="dark"]) svg .edge {
		stroke: #9ca3af;
	}

	:global([data-theme="dark"]) .weight-label {
		fill: var(--pico-color, #f3f4f6);
	}

	.edge-group {
		transition: all 0.3s ease;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.graph-visualizer {
			gap: 0.75rem;
		}
		
		.graph-stats {
			padding: 0.5rem;
		}
		
		.graph-stats h4 {
			font-size: 0.75rem;
			margin-bottom: 0.4rem;
		}
		
		.stats-grid {
			gap: 1rem;
		}
		
		.stat-value {
			font-size: 0.9rem;
		}
		
		.stat-label {
			font-size: 0.6rem;
		}
		
		.controls-row {
			flex-direction: column;
			gap: 0.5rem;
			align-items: stretch;
		}
		
		.control-buttons {
			justify-content: center;
		}
		
		.control-buttons button.compact {
			min-width: 2.25rem;
			height: 2.25rem;
		}
		
	}

	@media (max-width: 480px) {
		.stats-grid {
			gap: 1rem;
		}
		
		.stat-value {
			font-size: 0.85rem;
		}
		
		.stat-label {
			font-size: 0.55rem;
		}
		
		.control-buttons button.compact {
			min-width: 2rem;
			height: 2rem;
		}
		
	}
</style>
