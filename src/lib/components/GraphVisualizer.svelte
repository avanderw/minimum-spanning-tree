<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { Graph, Edge } from '$lib/mst/types';

	export let graph: Graph;
	export let mstEdges: Edge[] = [];
	export let highlightedEdges: Edge[] = [];
	export let currentStep = 0;
	export let animationSpeed = 1000; // ms between steps

	const dispatch = createEventDispatcher();

	let svgElement: SVGElement;
	let positions: Record<string, { x: number; y: number }> = {};
	
	const SVG_WIDTH = 600;
	const SVG_HEIGHT = 400;
	const VERTEX_RADIUS = 20;
	const ANIMATION_DURATION = 300;

	// Generate positions for vertices in a circle
	function generatePositions() {
		const centerX = SVG_WIDTH / 2;
		const centerY = SVG_HEIGHT / 2;
		const radius = Math.min(SVG_WIDTH, SVG_HEIGHT) * 0.35;
		
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

	onMount(() => {
		generatePositions();
	});

	// Regenerate positions when graph changes
	$: if (graph) {
		generatePositions();
	}
</script>

<div class="graph-visualizer">
	<svg bind:this={svgElement} width={SVG_WIDTH} height={SVG_HEIGHT}>
		<!-- Grid background -->
		<defs>
			<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
				<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="0.5" opacity="0.3"/>
			</pattern>
		</defs>
		<rect width="100%" height="100%" fill="url(#grid)" />
		
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
	
	<div class="legend">
		<div class="legend-item">
			<div class="legend-line edge"></div>
			<span>Original Edge</span>
		</div>
		<div class="legend-item">
			<div class="legend-line mst"></div>
			<span>MST Edge</span>
		</div>
		<div class="legend-item">
			<div class="legend-line highlighted"></div>
			<span>Current Step</span>
		</div>
	</div>
</div>

<style>
	.graph-visualizer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	svg {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: #ffffff;
	}

	svg .edge {
		stroke: #6b7280;
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

	.vertex {
		fill: #ffffff;
		stroke: #3b82f6;
		stroke-width: 3;
		transition: all 0.3s ease;
		filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));
	}

	.vertex:hover {
		fill: #3b82f6;
		cursor: pointer;
		transform: scale(1.1);
		filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.5));
	}

	.vertex-label {
		fill: #3b82f6;
		font-weight: bold;
		font-size: 14px;
		pointer-events: none;
	}

	.weight-bg {
		fill: #ffffff;
		stroke: #e5e7eb;
		stroke-width: 1;
	}

	.weight-label {
		fill: #374151;
		font-size: 11px;
		font-weight: bold;
		pointer-events: none;
	}

	.legend {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
		justify-content: center;
		padding: 1rem;
		background: #ffffff;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.legend-line {
		width: 30px;
		height: 3px;
		border-radius: 2px;
	}

	.legend-line.edge {
		background: #6b7280;
	}

	.legend-line.mst {
		background: #22c55e;
	}

	.legend-line.highlighted {
		background: #f59e0b;
		animation: dash 1.5s linear infinite, pulse 2s ease-in-out infinite alternate;
		box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
	}

	@keyframes pulse {
		0% { opacity: 0.8; }
		100% { opacity: 1; }
	}

	.edge-group {
		transition: all 0.3s ease;
	}
</style>
