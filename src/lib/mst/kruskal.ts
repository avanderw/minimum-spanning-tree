// Kruskal's algorithm implementation
import type { Graph, MSTResult, Edge, AnimationStep } from './types';

class UnionFind {
	private parent: Map<string, string>;
	private rank: Map<string, number>;

	constructor(vertices: string[]) {
		this.parent = new Map();
		this.rank = new Map();
		
		for (const vertex of vertices) {
			this.parent.set(vertex, vertex);
			this.rank.set(vertex, 0);
		}
	}

	find(x: string): string {
		if (this.parent.get(x) !== x) {
			this.parent.set(x, this.find(this.parent.get(x)!));
		}
		return this.parent.get(x)!;
	}

	union(x: string, y: string): boolean {
		const rootX = this.find(x);
		const rootY = this.find(y);

		if (rootX === rootY) return false;

		const rankX = this.rank.get(rootX)!;
		const rankY = this.rank.get(rootY)!;

		if (rankX < rankY) {
			this.parent.set(rootX, rootY);
		} else if (rankX > rankY) {
			this.parent.set(rootY, rootX);
		} else {
			this.parent.set(rootY, rootX);
			this.rank.set(rootX, rankX + 1);
		}
		return true;
	}

	connected(x: string, y: string): boolean {
		return this.find(x) === this.find(y);
	}
}

export function kruskal(graph: Graph): Promise<MSTResult> {
	return new Promise((resolve) => {
		const startTime = performance.now();
		const steps: string[] = [];
		const animationSteps: AnimationStep[] = [];
		const mstEdges: Edge[] = [];
		
		if (graph.vertices.length === 0) {
			resolve({ edges: [], totalWeight: 0, steps, animationSteps, executionTime: 0 });
			return;
		}

		// Sort edges by weight
		const sortedEdges = [...graph.edges].sort((a, b) => a.weight - b.weight);
		steps.push(`Sorted ${sortedEdges.length} edges by weight`);
		animationSteps.push({
			description: `Sorted ${sortedEdges.length} edges by weight`,
			highlightedEdges: [],
			mstEdges: [],
			action: 'considering'
		});

		const unionFind = new UnionFind(graph.vertices);
		
		for (const edge of sortedEdges) {
			if (!unionFind.connected(edge.from, edge.to)) {
				unionFind.union(edge.from, edge.to);
				mstEdges.push(edge);
				steps.push(`Added edge ${edge.from} → ${edge.to} with weight ${edge.weight}`);
				animationSteps.push({
					description: `Added edge ${edge.from} → ${edge.to} with weight ${edge.weight}`,
					highlightedEdges: [edge],
					mstEdges: [...mstEdges],
					currentEdge: edge,
					action: 'added'
				});
				
				if (mstEdges.length === graph.vertices.length - 1) {
					break; // MST is complete
				}
			} else {
				steps.push(`Skipped edge ${edge.from} → ${edge.to} (would create cycle)`);
				animationSteps.push({
					description: `Skipped edge ${edge.from} → ${edge.to} (would create cycle)`,
					highlightedEdges: [edge],
					mstEdges: [...mstEdges],
					currentEdge: edge,
					action: 'rejected'
				});
			}
		}

		const totalWeight = mstEdges.reduce((sum, edge) => sum + edge.weight, 0);
		const executionTime = performance.now() - startTime;
		
		steps.push(`Total MST weight: ${totalWeight}`);
		animationSteps.push({
			description: `Algorithm completed! Total MST weight: ${totalWeight}`,
			highlightedEdges: [],
			mstEdges: [...mstEdges],
			action: 'completed'
		});
		
		resolve({ edges: mstEdges, totalWeight, steps, animationSteps, executionTime });
	});
}
