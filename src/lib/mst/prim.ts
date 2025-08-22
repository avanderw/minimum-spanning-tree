// Prim's algorithm implementation
import type { Graph, MSTResult, Edge, AnimationStep } from './types';

export function prim(graph: Graph): Promise<MSTResult> {
	return new Promise((resolve) => {
		const startTime = performance.now();
		const steps: string[] = [];
		const animationSteps: AnimationStep[] = [];
		const mstEdges: Edge[] = [];
		
		// DEBUG: Initial state logging
		console.log('🔍 PRIM DEBUG: Starting algorithm');
		console.log('📊 Input graph:', {
			vertices: graph.vertices,
			edges: graph.edges,
			vertexCount: graph.vertices.length,
			edgeCount: graph.edges.length
		});
		
		if (graph.vertices.length === 0) {
			console.log('⚠️ PRIM DEBUG: Empty graph, returning early');
			resolve({ edges: [], totalWeight: 0, steps, animationSteps, executionTime: 0 });
			return;
		}

		const visited = new Set<string>();

		// Start with the first vertex
		const startVertex = graph.vertices[0];
		visited.add(startVertex);
		
		console.log('🚀 PRIM DEBUG: Started with vertex:', startVertex);
		console.log('👁️ PRIM DEBUG: Visited set initialized:', Array.from(visited));
		
		steps.push(`Started with vertex ${startVertex}`);
		const initialStep = {
			description: `Started with vertex ${startVertex}`,
			highlightedEdges: [],
			mstEdges: [],
			action: 'considering' as const
		};
		animationSteps.push(initialStep);
		console.log('🎬 PRIM DEBUG: Added initial animation step:', initialStep);

		// Continue until all vertices are in MST
		let iteration = 1;
		while (visited.size < graph.vertices.length) {
			console.log(`🔄 PRIM DEBUG: Iteration ${iteration}`);
			console.log('👁️ PRIM DEBUG: Visited vertices:', Array.from(visited));
			console.log('🔍 PRIM DEBUG: Unvisited vertices:', graph.vertices.filter((v: string) => !visited.has(v)));
			
			let minEdge: Edge | null = null;
			let minWeight = Infinity;
			const candidateEdges: Edge[] = [];

			console.log('🔍 PRIM DEBUG: Looking for edges from visited to unvisited vertices...');

			// Find all edges that connect visited vertices to unvisited vertices
			for (const edge of graph.edges) {
				const fromVisited = visited.has(edge.from);
				const toVisited = visited.has(edge.to);
				
				console.log(`🔗 PRIM DEBUG: Checking edge ${edge.from}→${edge.to} (${edge.weight}): fromVisited=${fromVisited}, toVisited=${toVisited}`);
				
				// Edge connects visited to unvisited vertex (either direction)
				if (fromVisited && !toVisited) {
					// Edge goes from visited to unvisited
					candidateEdges.push(edge);
					console.log(`✅ PRIM DEBUG: Added candidate edge ${edge.from}→${edge.to} (${edge.weight}) - from visited to unvisited`);
					
					if (edge.weight < minWeight) {
						minWeight = edge.weight;
						minEdge = edge;
						console.log(`🏆 PRIM DEBUG: New minimum edge: ${edge.from}→${edge.to} (${edge.weight})`);
					}
				} else if (!fromVisited && toVisited) {
					// Edge goes from unvisited to visited
					candidateEdges.push(edge);
					console.log(`✅ PRIM DEBUG: Added candidate edge ${edge.from}→${edge.to} (${edge.weight}) - from unvisited to visited`);
					
					if (edge.weight < minWeight) {
						minWeight = edge.weight;
						minEdge = edge;
						console.log(`🏆 PRIM DEBUG: New minimum edge: ${edge.from}→${edge.to} (${edge.weight})`);
					}
				}
			}
			
			console.log('📋 PRIM DEBUG: Candidate edges:', candidateEdges.map(e => `${e.from}→${e.to} (${e.weight})`));
			console.log('🏆 PRIM DEBUG: Selected minimum edge:', minEdge ? `${minEdge.from}→${minEdge.to} (${minEdge.weight})` : 'none');

			if (candidateEdges.length > 0 && minEdge) {
				// Always show candidate edges being considered
				const candidateStep = {
					description: `Examining ${candidateEdges.length} candidate edge${candidateEdges.length !== 1 ? 's' : ''} from visited vertices (${Array.from(visited).join(', ')})`,
					highlightedEdges: [...candidateEdges],
					mstEdges: [...mstEdges],
					action: 'considering' as const
				};
				animationSteps.push(candidateStep);
				console.log('🎬 PRIM DEBUG: Added candidate edges animation step:', candidateStep);

				// Determine which vertex is new (not yet visited)
				const newVertex = visited.has(minEdge.from) ? minEdge.to : minEdge.from;
				console.log(`🆕 PRIM DEBUG: New vertex to be added: ${newVertex}`);
				
				// Add the selected edge to MST and visit the new vertex
				mstEdges.push(minEdge);
				visited.add(newVertex);
				
				const stepDesc = `Added edge ${minEdge.from} → ${minEdge.to} with weight ${minEdge.weight}, visiting vertex ${newVertex}`;
				steps.push(stepDesc);
				
				// Show the edge being added to MST
				const addedStep = {
					description: `Selected minimum edge: ${minEdge.from} → ${minEdge.to} (weight ${minEdge.weight}). Added vertex ${newVertex} to MST.`,
					highlightedEdges: [],
					mstEdges: [...mstEdges],
					currentEdge: minEdge,
					action: 'added' as const
				};
				animationSteps.push(addedStep);
				console.log('🎬 PRIM DEBUG: Added edge animation step:', addedStep);
				console.log('🌳 PRIM DEBUG: MST edges so far:', mstEdges.map(e => `${e.from}→${e.to} (${e.weight})`));
				console.log('👁️ PRIM DEBUG: Visited vertices now:', Array.from(visited));
			} else {
				// No more edges found - graph might be disconnected
				const errorMsg = 'No candidate edges found - algorithm complete or graph disconnected';
				console.log('🛑 PRIM DEBUG:', errorMsg);
				console.log('🔍 PRIM DEBUG: Final state - visited:', Array.from(visited), 'total vertices:', graph.vertices.length);
				steps.push(errorMsg);
				break;
			}
			
			iteration++;
		}

		const totalWeight = mstEdges.reduce((sum, edge) => sum + edge.weight, 0);
		const executionTime = performance.now() - startTime;
		
		console.log('🏁 PRIM DEBUG: Algorithm completed!');
		console.log('📊 PRIM DEBUG: Final results:', {
			mstEdges: mstEdges.map(e => `${e.from}→${e.to} (${e.weight})`),
			totalWeight,
			executionTime,
			visitedVertices: Array.from(visited),
			animationStepCount: animationSteps.length
		});
		
		steps.push(`Algorithm completed! Total MST weight: ${totalWeight}`);
		const completedStep = {
			description: `Algorithm completed! MST contains ${mstEdges.length} edges with total weight ${totalWeight}`,
			highlightedEdges: [],
			mstEdges: [...mstEdges],
			action: 'completed' as const
		};
		animationSteps.push(completedStep);
		console.log('🎬 PRIM DEBUG: Added completion step:', completedStep);
		
		console.log('🎬 PRIM DEBUG: Final animation steps summary:');
		animationSteps.forEach((step, i) => {
			console.log(`  ${i}: ${step.action} - ${step.description}`);
			console.log(`      highlighted: ${step.highlightedEdges.length}, mst: ${step.mstEdges.length}${step.currentEdge ? `, current: ${step.currentEdge.from}→${step.currentEdge.to}` : ''}`);
		});
		
		resolve({ edges: mstEdges, totalWeight, steps, animationSteps, executionTime });
	});
}
