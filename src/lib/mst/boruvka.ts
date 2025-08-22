// Borůvka's algorithm implementation
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

	getComponents(): Map<string, string[]> {
		const components = new Map<string, string[]>();
		for (const [vertex] of this.parent) {
			const root = this.find(vertex);
			if (!components.has(root)) {
				components.set(root, []);
			}
			components.get(root)!.push(vertex);
		}
		return components;
	}
}

export function boruvka(graph: Graph): Promise<MSTResult> {
	return new Promise((resolve) => {
		const startTime = performance.now();
		const steps: string[] = [];
		const animationSteps: AnimationStep[] = [];
		const mstEdges: Edge[] = [];
		
		// DEBUG: Initial state logging
		console.log('🔍 BORUVKA DEBUG: Starting algorithm');
		console.log('📊 Input graph:', {
			vertices: graph.vertices,
			edges: graph.edges,
			vertexCount: graph.vertices.length,
			edgeCount: graph.edges.length
		});
		
		if (graph.vertices.length === 0) {
			console.log('⚠️ BORUVKA DEBUG: Empty graph, returning early');
			resolve({ edges: [], totalWeight: 0, steps, animationSteps, executionTime: 0 });
			return;
		}

		const unionFind = new UnionFind(graph.vertices);
		let iteration = 1;
		
		console.log('🚀 BORUVKA DEBUG: Initialized union-find structure');
		console.log('📝 Initial components:', unionFind.getComponents());
		
		steps.push(`Starting Borůvka's algorithm with ${graph.vertices.length} vertices`);
		const initialStep = {
			description: `Starting Borůvka's algorithm with ${graph.vertices.length} vertices`,
			highlightedEdges: [],
			mstEdges: [],
			action: 'considering' as const
		};
		animationSteps.push(initialStep);
		
		console.log('🎬 BORUVKA DEBUG: Added initial animation step:', initialStep);

		while (true) {
			const components = unionFind.getComponents();
			console.log(`🔄 BORUVKA DEBUG: Iteration ${iteration} - Components:`, components);
			
			if (components.size === 1) {
				console.log('✅ BORUVKA DEBUG: MST complete - only one component remaining');
				break; // MST is complete
			}

			const stepDesc = `Iteration ${iteration}: Found ${components.size} components`;
			steps.push(stepDesc);
			const iterationStep = {
				description: stepDesc,
				highlightedEdges: [],
				mstEdges: [...mstEdges],
				action: 'considering' as const
			};
			animationSteps.push(iterationStep);
			console.log('🎬 BORUVKA DEBUG: Added iteration step:', iterationStep);

			const cheapestEdge = new Map<string, Edge>();
			const candidateEdges: Edge[] = [];

			console.log('🔍 BORUVKA DEBUG: Looking for cheapest edges for each component...');
			
			// Find cheapest edge for each component
			for (const edge of graph.edges) {
				const rootFrom = unionFind.find(edge.from);
				const rootTo = unionFind.find(edge.to);

				if (rootFrom !== rootTo) {
					candidateEdges.push(edge);
					console.log(`🔗 BORUVKA DEBUG: Candidate edge ${edge.from}→${edge.to} (${edge.weight}) connects components ${rootFrom} and ${rootTo}`);
					
					// Update cheapest edge for both components
					for (const root of [rootFrom, rootTo]) {
						const currentCheapest = cheapestEdge.get(root);
						if (!currentCheapest || edge.weight < currentCheapest.weight) {
							console.log(`💰 BORUVKA DEBUG: New cheapest edge for component ${root}: ${edge.from}→${edge.to} (${edge.weight}), was: ${currentCheapest ? `${currentCheapest.from}→${currentCheapest.to} (${currentCheapest.weight})` : 'none'}`);
							cheapestEdge.set(root, edge);
						}
					}
				}
			}
			
			console.log('📋 BORUVKA DEBUG: Final cheapest edges per component:', 
				Array.from(cheapestEdge.entries()).map(([comp, edge]) => 
					`${comp}: ${edge.from}→${edge.to} (${edge.weight})`
				)
			);

			// Show candidate edges
			if (candidateEdges.length > 0) {
				const candidateStep = {
					description: `Found ${candidateEdges.length} candidate edges between components`,
					highlightedEdges: candidateEdges,
					mstEdges: [...mstEdges],
					action: 'considering' as const
				};
				animationSteps.push(candidateStep);
				console.log('🎬 BORUVKA DEBUG: Added candidate edges step:', candidateStep);
				console.log('🎯 BORUVKA DEBUG: Candidate edges:', candidateEdges.map(e => `${e.from}→${e.to} (${e.weight})`));
			}

			// Add all cheapest edges (avoiding duplicates)
			const addedEdges = new Set<string>();
			let edgesAdded = 0;
			
			console.log('➕ BORUVKA DEBUG: Adding cheapest edges to MST...');
			
			for (const edge of cheapestEdge.values()) {
				const edgeKey = `${edge.from}-${edge.to}-${edge.weight}`;
				const reverseKey = `${edge.to}-${edge.from}-${edge.weight}`;
				
				console.log(`🔍 BORUVKA DEBUG: Checking edge ${edge.from}→${edge.to} (${edge.weight})`);
				console.log(`🔑 BORUVKA DEBUG: Edge key: ${edgeKey}, reverse: ${reverseKey}`);
				console.log(`🚫 BORUVKA DEBUG: Already added? ${addedEdges.has(edgeKey) || addedEdges.has(reverseKey)}`);
				
				if (!addedEdges.has(edgeKey) && !addedEdges.has(reverseKey)) {
					const beforeComponents = unionFind.getComponents().size;
					const unionResult = unionFind.union(edge.from, edge.to);
					const afterComponents = unionFind.getComponents().size;
					
					console.log(`🔗 BORUVKA DEBUG: Union ${edge.from} and ${edge.to}: ${unionResult ? 'SUCCESS' : 'FAILED'}`);
					console.log(`📊 BORUVKA DEBUG: Components before: ${beforeComponents}, after: ${afterComponents}`);
					
					if (unionResult) {
						mstEdges.push(edge);
						addedEdges.add(edgeKey);
						const stepDesc = `Added edge ${edge.from} → ${edge.to} with weight ${edge.weight}`;
						steps.push(stepDesc);
						
						const addedStep = {
							description: stepDesc,
							highlightedEdges: [edge],
							mstEdges: [...mstEdges],
							currentEdge: edge,
							action: 'added' as const
						};
						animationSteps.push(addedStep);
						console.log('🎬 BORUVKA DEBUG: Added edge animation step:', addedStep);
						console.log('🌳 BORUVKA DEBUG: MST edges so far:', mstEdges.map(e => `${e.from}→${e.to} (${e.weight})`));
						
						edgesAdded++;
					}
				}
			}
			
			console.log(`📈 BORUVKA DEBUG: Added ${edgesAdded} edges in iteration ${iteration}`);

			if (edgesAdded === 0) {
				console.log('🛑 BORUVKA DEBUG: No edges added in this iteration - breaking');
				break; // No more edges to add
			}

			iteration++;
			console.log(`🔄 BORUVKA DEBUG: Completed iteration ${iteration-1}, moving to iteration ${iteration}`);
		}

		const totalWeight = mstEdges.reduce((sum, edge) => sum + edge.weight, 0);
		const executionTime = performance.now() - startTime;
		
		console.log('🏁 BORUVKA DEBUG: Algorithm completed!');
		console.log('📊 BORUVKA DEBUG: Final results:', {
			mstEdges: mstEdges.map(e => `${e.from}→${e.to} (${e.weight})`),
			totalWeight,
			executionTime,
			animationStepCount: animationSteps.length
		});
		
		steps.push(`Total MST weight: ${totalWeight}`);
		const completedStep = {
			description: `Algorithm completed! Total MST weight: ${totalWeight}`,
			highlightedEdges: [],
			mstEdges: [...mstEdges],
			action: 'completed' as const
		};
		animationSteps.push(completedStep);
		console.log('🎬 BORUVKA DEBUG: Added completion step:', completedStep);
		
		console.log('🎬 BORUVKA DEBUG: Final animation steps summary:');
		animationSteps.forEach((step, i) => {
			console.log(`  ${i}: ${step.action} - ${step.description}`);
			console.log(`      highlighted: ${step.highlightedEdges.length}, mst: ${step.mstEdges.length}${step.currentEdge ? `, current: ${step.currentEdge.from}→${step.currentEdge.to}` : ''}`);
		});
		
		resolve({ edges: mstEdges, totalWeight, steps, animationSteps, executionTime });
	});
}