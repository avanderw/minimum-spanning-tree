export interface Edge {
	from: string;
	to: string;
	weight: number;
}

export interface Graph {
	vertices: string[];
	edges: Edge[];
}

export interface AnimationStep {
	description: string;
	highlightedEdges: Edge[];
	mstEdges: Edge[];
	currentEdge?: Edge;
	action: 'considering' | 'added' | 'rejected' | 'completed' | 'removing' | 'keeping';
}

export interface MSTResult {
	edges: Edge[];
	totalWeight: number;
	steps?: string[];
	animationSteps?: AnimationStep[];
	executionTime?: number;
}

export interface UnionFind {
	find(x: string): string;
	union(x: string, y: string): boolean;
	connected(x: string, y: string): boolean;
}
