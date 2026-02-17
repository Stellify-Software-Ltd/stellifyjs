interface EmbedOptions {
    dimensions?: number;
}
interface SimilarityResult {
    id: string;
    score: number;
    vector: number[];
    metadata?: Record<string, unknown>;
}
interface StoredVector {
    id: string;
    vector: number[];
    metadata?: Record<string, unknown>;
}
export declare class Embed {
    private dimensions;
    private vectors;
    private constructor();
    static create(options?: EmbedOptions): Embed;
    store(id: string, vector: number[], metadata?: Record<string, unknown>): this;
    storeMany(items: Array<{
        id: string;
        vector: number[];
        metadata?: Record<string, unknown>;
    }>): this;
    get(id: string): StoredVector | undefined;
    remove(id: string): this;
    clear(): this;
    count(): number;
    compare(a: number[], b: number[]): number;
    nearest(query: number[], topK?: number): SimilarityResult[];
    search(query: number[], threshold?: number): SimilarityResult[];
    static cosineSimilarity(a: number[], b: number[]): number;
    static euclideanDistance(a: number[], b: number[]): number;
    static dotProduct(a: number[], b: number[]): number;
    static normalize(vector: number[]): number[];
    static average(vectors: number[][]): number[];
    toJSON(): string;
    static fromJSON(json: string): Embed;
}
export declare class EmbedError extends Error {
    constructor(message: string);
}
export {};
