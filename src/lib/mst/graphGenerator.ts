import type { Graph, Edge } from './types';

export interface GraphGeneratorOptions {
	vertexCount: number;
	edgeDensity: number; // 0-1, where 1 means complete graph
	minWeight: number;
	maxWeight: number;
	seed?: number;
}

class SeededRandom {
	private seed: number;

	constructor(seed?: number) {
		this.seed = seed || Math.floor(Math.random() * 1000000);
	}

	next(): number {
		this.seed = (this.seed * 9301 + 49297) % 233280;
		return this.seed / 233280;
	}

	nextInt(min: number, max: number): number {
		return Math.floor(this.next() * (max - min + 1)) + min;
	}
}

function generateVertexNames(count: number): string[] {
	const names: string[] = [];
	
	if (count <= 26) {
		// Use letters A-Z
		for (let i = 0; i < count; i++) {
			names.push(String.fromCharCode(65 + i)); // A, B, C, ...
		}
	} else {
		// Use numbers for larger graphs
		for (let i = 1; i <= count; i++) {
			names.push(i.toString());
		}
	}
	
	return names;
}

function shuffleArray<T>(array: T[], random: SeededRandom): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(random.next() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export function generateRandomGraph(options: GraphGeneratorOptions): Graph {
	const { vertexCount, edgeDensity, minWeight, maxWeight, seed } = options;
	const random = new SeededRandom(seed);
	
	if (vertexCount < 2) {
		throw new Error('Graph must have at least 2 vertices');
	}

	const vertices = generateVertexNames(vertexCount);
	const edges: Edge[] = [];
	
	// Calculate maximum possible edges (complete graph)
	const maxEdges = (vertexCount * (vertexCount - 1)) / 2;
	const targetEdgeCount = Math.max(vertexCount - 1, Math.floor(maxEdges * edgeDensity));
	
	// Generate all possible edges
	const possibleEdges: { from: string; to: string }[] = [];
	for (let i = 0; i < vertices.length; i++) {
		for (let j = i + 1; j < vertices.length; j++) {
			possibleEdges.push({ from: vertices[i], to: vertices[j] });
		}
	}
	
	// Shuffle possible edges to randomize selection
	const shuffledEdges = shuffleArray(possibleEdges, random);
	
	// Ensure graph is connected by creating a spanning tree first
	const connectedVertices = new Set([vertices[0]]);
	const remainingVertices = [...vertices.slice(1)];
	
	// Create minimum spanning tree to ensure connectivity
	while (remainingVertices.length > 0) {
		const connectedVertex = Array.from(connectedVertices)[
			Math.floor(random.next() * connectedVertices.size)
		];
		const newVertexIndex = Math.floor(random.next() * remainingVertices.length);
		const newVertex = remainingVertices[newVertexIndex];
		
		const weight = random.nextInt(minWeight, maxWeight);
		edges.push({ from: connectedVertex, to: newVertex, weight });
		
		connectedVertices.add(newVertex);
		remainingVertices.splice(newVertexIndex, 1);
	}
	
	// Add additional edges up to the target count
	for (const edge of shuffledEdges) {
		if (edges.length >= targetEdgeCount) break;
		
		// Skip if edge already exists (from spanning tree creation)
		const edgeExists = edges.some(
			e => (e.from === edge.from && e.to === edge.to) || 
				 (e.from === edge.to && e.to === edge.from)
		);
		
		if (!edgeExists) {
			const weight = random.nextInt(minWeight, maxWeight);
			edges.push({ from: edge.from, to: edge.to, weight });
		}
	}
	
	return { vertices, edges };
}

export const PRESET_GRAPHS: Record<string, Graph> = {
	simple: {
		vertices: ['A', 'B', 'C', 'D'],
		edges: [
			{ from: 'A', to: 'B', weight: 1 },
			{ from: 'B', to: 'C', weight: 2 },
			{ from: 'C', to: 'D', weight: 3 },
			{ from: 'A', to: 'D', weight: 4 }
		]
	},
	
	textbook: {
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
	},
	
	complex: {
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
	}
};

export function generateGraphVariations(baseGraph: Graph): Graph[] {
	const variations: Graph[] = [baseGraph];
	const random = new SeededRandom(12345);
	
	// Create variations with different weights
	for (let i = 0; i < 3; i++) {
		const variation: Graph = {
			vertices: [...baseGraph.vertices],
			edges: baseGraph.edges.map(edge => ({
				...edge,
				weight: Math.max(1, edge.weight + random.nextInt(-2, 2))
			}))
		};
		variations.push(variation);
	}
	
	return variations;
}
