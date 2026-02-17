type NodeData = Record<string, unknown>;
type TraverseCallback = (node: TreeNode, depth: number) => void | boolean;
interface TreeNode {
    id: string;
    parentId: string | null;
    data: NodeData;
    children: string[];
}
export declare class Tree {
    private nodes;
    private rootId;
    private constructor();
    static create(): Tree;
    setRoot(id: string, data?: NodeData): Tree;
    addChild(parentId: string, id: string, data?: NodeData): Tree;
    removeNode(id: string): Tree;
    getNode(id: string): TreeNode | null;
    getRoot(): TreeNode | null;
    getChildren(id: string): TreeNode[];
    getParent(id: string): TreeNode | null;
    getSiblings(id: string): TreeNode[];
    getAncestors(id: string): TreeNode[];
    getDescendants(id: string): TreeNode[];
    getDepth(id: string): number;
    getPath(id: string): TreeNode[];
    traverse(callback: TraverseCallback, order?: 'pre' | 'post'): Tree;
    find(predicate: (node: TreeNode) => boolean): TreeNode | null;
    findAll(predicate: (node: TreeNode) => boolean): TreeNode[];
    move(id: string, newParentId: string): Tree;
    toArray(): TreeNode[];
    size(): number;
}
export {};
