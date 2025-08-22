// Reverse-Delete algorithm implementation
import type { Graph, MSTResult, Edge, AnimationStep } from './types';

function isConnected(vertices: string[], edges: Edge[]): boolean {
	if (vertices.length === 0) return true;
	
	const adjList = new Map<string, string[]>();
	for (const vertex of vertices) {
		adjList.set(vertex, []);
	}
	
	for (const edge of edges) {
		adjList.get(edge.from)?.push(edge.to);
		adjList.get(edge.to)?.push(edge.from);
	}
	
	const visited = new Set<string>();
	const stack = [vertices[0]];
	
	while (stack.length > 0) {
		const current = stack.pop()!;
		if (visited.has(current)) continue;
		
		visited.add(current);
		const neighbors = adjList.get(current) || [];
		
		for (const neighbor of neighbors) {
			if (!visited.has(neighbor)) {
				stack.push(neighbor);
			}
		}
	}
	
	return visited.size === vertices.length;
}

export function reverseDelete(graph: Graph): Promise<MSTResult> {
	return new Promise((resolve) => {
		const startTime = performance.now();
		const steps: string[] = [];
		const animationSteps: AnimationStep[] = [];
		
		if (graph.vertices.length === 0) {
			resolve({ edges: [], totalWeight: 0, steps, animationSteps, executionTime: 0 });
			return;
		}

		// Start with all edges, sorted by weight in descending order
		let currentEdges = [...graph.edges];
		const sortedEdges = [...graph.edges].sort((a, b) => b.weight - a.weight);
		
		steps.push(`Starting with all ${currentEdges.length} edges`);
		steps.push(`Sorted edges by weight (heaviest first)`);
		
		// Initial step - show all edges as regular edges (not MST)
		animationSteps.push({
			description: `Starting with all ${currentEdges.length} edges`,
			highlightedEdges: [],
			mstEdges: [], // Start with no MST edges
			action: 'considering'
		});

		for (let i = 0; i < sortedEdges.length; i++) {
			const edge = sortedEdges[i];
			
			// Try removing this edge
			const edgesWithoutCurrent = currentEdges.filter(e => 
				!(e.from === edge.from && e.to === edge.to && e.weight === edge.weight) &&
				!(e.from === edge.to && e.to === edge.from && e.weight === edge.weight)
			);

			// Check if graph remains connected
			if (isConnected(graph.vertices, edgesWithoutCurrent)) {
				// Can remove this edge
				currentEdges = edgesWithoutCurrent;
				steps.push(`Removed edge ${edge.from} → ${edge.to} with weight ${edge.weight} (graph stays connected)`);
				animationSteps.push({
					description: `Removed edge ${edge.from} → ${edge.to} with weight ${edge.weight}`,
					highlightedEdges: [edge],
					mstEdges: [], // Don't show any MST edges yet - we're still eliminating
					action: 'removing'
				});
			} else {
				// Must keep this edge
				steps.push(`Kept edge ${edge.from} → ${edge.to} with weight ${edge.weight} (removal would disconnect graph)`);
				animationSteps.push({
					description: `Kept edge ${edge.from} → ${edge.to} with weight ${edge.weight} - required for connectivity`,
					highlightedEdges: [edge],
					mstEdges: [], // Still don't show MST edges until final step
					action: 'keeping'
				});
			}
		}

		const totalWeight = currentEdges.reduce((sum, edge) => sum + edge.weight, 0);
		const executionTime = performance.now() - startTime;
		
		steps.push(`Final MST has ${currentEdges.length} edges`);
		steps.push(`Total MST weight: ${totalWeight}`);
		
		// Final step - show the final MST edges
		animationSteps.push({
			description: `Final MST has ${currentEdges.length} edges, total weight: ${totalWeight}`,
			highlightedEdges: [],
			mstEdges: [...currentEdges], // Only now show the final MST edges
			action: 'completed'
		});
		
		resolve({ edges: currentEdges, totalWeight, steps, animationSteps, executionTime });
	});
}