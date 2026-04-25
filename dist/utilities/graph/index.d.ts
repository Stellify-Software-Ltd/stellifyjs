type NodeOptions = {
    label?: string;
    data?: Record<string, unknown>;
};
type EdgeOptions = {
    label?: string;
    weight?: number;
    data?: Record<string, unknown>;
};
type LayoutType = 'force' | 'tree' | 'grid' | 'circular';
interface Node {
    id: string;
    x: number;
    y: number;
    label?: string;
    data?: Record<string, unknown>;
}
interface Edge {
    from: string;
    to: string;
    label?: string;
    weight: number;
    data?: Record<string, unknown>;
}
export declare class Graph {
    private nodes;
    private edges;
    private width;
    private height;
    private constructor();
    static create(): Graph;
    size(width: number, height: number): Graph;
    addNode(id: string, options?: NodeOptions): Graph;
    removeNode(id: string): Graph;
    addEdge(from: string, to: string, options?: EdgeOptions): Graph;
    removeEdge(from: string, to: string): Graph;
    getNode(id: string): Node | null;
    getNodes(): Node[];
    getEdges(): Edge[];
    getEdgesWithPositions(): Array<Edge & {
        sourceX: number;
        sourceY: number;
        targetX: number;
        targetY: number;
    }>;
    getNeighbors(id: string): Node[];
    layout(type?: LayoutType): Graph;
    private applyForceLayout;
    private applyTreeLayout;
    private applyGridLayout;
    private applyCircularLayout;
}
export {};
