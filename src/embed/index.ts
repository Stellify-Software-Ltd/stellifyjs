interface EmbedOptions {
  dimensions?: number
}

interface SimilarityResult {
  id: string
  score: number
  vector: number[]
  metadata?: Record<string, unknown>
}

interface StoredVector {
  id: string
  vector: number[]
  metadata?: Record<string, unknown>
}

export class Embed {
  private dimensions: number
  private vectors: Map<string, StoredVector> = new Map()

  private constructor(options: EmbedOptions = {}) {
    this.dimensions = options.dimensions ?? 1536
  }

  static create(options: EmbedOptions = {}): Embed {
    return new Embed(options)
  }

  store(id: string, vector: number[], metadata?: Record<string, unknown>): this {
    if (vector.length !== this.dimensions) {
      throw new EmbedError(`Vector dimension mismatch: expected ${this.dimensions}, got ${vector.length}`)
    }

    this.vectors.set(id, { id, vector, metadata })
    return this
  }

  storeMany(items: Array<{ id: string; vector: number[]; metadata?: Record<string, unknown> }>): this {
    items.forEach(item => this.store(item.id, item.vector, item.metadata))
    return this
  }

  get(id: string): StoredVector | undefined {
    return this.vectors.get(id)
  }

  remove(id: string): this {
    this.vectors.delete(id)
    return this
  }

  clear(): this {
    this.vectors.clear()
    return this
  }

  count(): number {
    return this.vectors.size
  }

  compare(a: number[], b: number[]): number {
    return Embed.cosineSimilarity(a, b)
  }

  nearest(query: number[], topK: number = 5): SimilarityResult[] {
    const results: SimilarityResult[] = []

    this.vectors.forEach(stored => {
      const score = this.compare(query, stored.vector)
      results.push({
        id: stored.id,
        score,
        vector: stored.vector,
        metadata: stored.metadata
      })
    })

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  search(query: number[], threshold: number = 0.7): SimilarityResult[] {
    return this.nearest(query, this.vectors.size)
      .filter(r => r.score >= threshold)
  }

  // Static similarity functions
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new EmbedError('Vectors must have same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    return denominator === 0 ? 0 : dotProduct / denominator
  }

  static euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new EmbedError('Vectors must have same length')
    }

    let sum = 0
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i]
      sum += diff * diff
    }

    return Math.sqrt(sum)
  }

  static dotProduct(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new EmbedError('Vectors must have same length')
    }

    let sum = 0
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i]
    }

    return sum
  }

  static normalize(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
    if (norm === 0) return vector
    return vector.map(v => v / norm)
  }

  static average(vectors: number[][]): number[] {
    if (vectors.length === 0) return []

    const dimensions = vectors[0].length
    const result = new Array(dimensions).fill(0)

    for (const vector of vectors) {
      for (let i = 0; i < dimensions; i++) {
        result[i] += vector[i]
      }
    }

    return result.map(v => v / vectors.length)
  }

  // Serialization for persistence
  toJSON(): string {
    return JSON.stringify({
      dimensions: this.dimensions,
      vectors: Array.from(this.vectors.values())
    })
  }

  static fromJSON(json: string): Embed {
    const data = JSON.parse(json)
    const embed = new Embed({ dimensions: data.dimensions })
    data.vectors.forEach((v: StoredVector) => embed.store(v.id, v.vector, v.metadata))
    return embed
  }
}

export class EmbedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EmbedError'
  }
}
