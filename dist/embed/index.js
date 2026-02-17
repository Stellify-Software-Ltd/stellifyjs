export class Embed {
    dimensions;
    vectors = new Map();
    constructor(options = {}) {
        this.dimensions = options.dimensions ?? 1536;
    }
    static create(options = {}) {
        return new Embed(options);
    }
    store(id, vector, metadata) {
        if (vector.length !== this.dimensions) {
            throw new EmbedError(`Vector dimension mismatch: expected ${this.dimensions}, got ${vector.length}`);
        }
        this.vectors.set(id, { id, vector, metadata });
        return this;
    }
    storeMany(items) {
        items.forEach(item => this.store(item.id, item.vector, item.metadata));
        return this;
    }
    get(id) {
        return this.vectors.get(id);
    }
    remove(id) {
        this.vectors.delete(id);
        return this;
    }
    clear() {
        this.vectors.clear();
        return this;
    }
    count() {
        return this.vectors.size;
    }
    compare(a, b) {
        return Embed.cosineSimilarity(a, b);
    }
    nearest(query, topK = 5) {
        const results = [];
        this.vectors.forEach(stored => {
            const score = this.compare(query, stored.vector);
            results.push({
                id: stored.id,
                score,
                vector: stored.vector,
                metadata: stored.metadata
            });
        });
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }
    search(query, threshold = 0.7) {
        return this.nearest(query, this.vectors.size)
            .filter(r => r.score >= threshold);
    }
    // Static similarity functions
    static cosineSimilarity(a, b) {
        if (a.length !== b.length) {
            throw new EmbedError('Vectors must have same length');
        }
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }
    static euclideanDistance(a, b) {
        if (a.length !== b.length) {
            throw new EmbedError('Vectors must have same length');
        }
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            const diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }
    static dotProduct(a, b) {
        if (a.length !== b.length) {
            throw new EmbedError('Vectors must have same length');
        }
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            sum += a[i] * b[i];
        }
        return sum;
    }
    static normalize(vector) {
        const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        if (norm === 0)
            return vector;
        return vector.map(v => v / norm);
    }
    static average(vectors) {
        if (vectors.length === 0)
            return [];
        const dimensions = vectors[0].length;
        const result = new Array(dimensions).fill(0);
        for (const vector of vectors) {
            for (let i = 0; i < dimensions; i++) {
                result[i] += vector[i];
            }
        }
        return result.map(v => v / vectors.length);
    }
    // Serialization for persistence
    toJSON() {
        return JSON.stringify({
            dimensions: this.dimensions,
            vectors: Array.from(this.vectors.values())
        });
    }
    static fromJSON(json) {
        const data = JSON.parse(json);
        const embed = new Embed({ dimensions: data.dimensions });
        data.vectors.forEach((v) => embed.store(v.id, v.vector, v.metadata));
        return embed;
    }
}
export class EmbedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'EmbedError';
    }
}
