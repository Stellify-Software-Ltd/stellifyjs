type NodeOptions = {
  label?: string
  data?: Record<string, unknown>
}

type EdgeOptions = {
  label?: string
  weight?: number
  data?: Record<string, unknown>
}

type LayoutType = 'force' | 'tree' | 'grid' | 'circular'

interface Node {
  id: string
  x: number
  y: number
  label?: string
  data?: Record<string, unknown>
}

interface Edge {
  from: string
  to: string
  label?: string
  weight: number
  data?: Record<string, unknown>
}

export class Graph {
  private nodes: Map<string, Node>
  private edges: Edge[]
  private width: number
  private height: number

  private constructor() {
    this.nodes = new Map()
    this.edges = []
    this.width = 800
    this.height = 600
  }

  static create(): Graph {
    return new Graph()
  }

  size(width: number, height: number): Graph {
    this.width = width
    this.height = height
    return this
  }

  addNode(id: string, options: NodeOptions = {}): Graph {
    if (this.nodes.has(id)) {
      throw new Error(`Node '${id}' already exists`)
    }

    this.nodes.set(id, {
      id,
      x: 0,
      y: 0,
      label: options.label,
      data: options.data
    })

    return this
  }

  removeNode(id: string): Graph {
    if (!this.nodes.has(id)) {
      throw new Error(`Node '${id}' not found`)
    }

    this.nodes.delete(id)
    this.edges = this.edges.filter(e => e.from !== id && e.to !== id)

    return this
  }

  addEdge(from: string, to: string, options: EdgeOptions = {}): Graph {
    if (!this.nodes.has(from)) {
      throw new Error(`Node '${from}' not found`)
    }
    if (!this.nodes.has(to)) {
      throw new Error(`Node '${to}' not found`)
    }

    this.edges.push({
      from,
      to,
      label: options.label,
      weight: options.weight ?? 1,
      data: options.data
    })

    return this
  }

  removeEdge(from: string, to: string): Graph {
    const initialLength = this.edges.length
    this.edges = this.edges.filter(e => !(e.from === from && e.to === to))

    if (this.edges.length === initialLength) {
      throw new Error(`Edge from '${from}' to '${to}' not found`)
    }

    return this
  }

  getNode(id: string): Node | null {
    return this.nodes.get(id) || null
  }

  getNodes(): Node[] {
    return Array.from(this.nodes.values())
  }

  getEdges(): Edge[] {
    return [...this.edges]
  }

  getEdgesWithPositions(): Array<Edge & { sourceX: number; sourceY: number; targetX: number; targetY: number }> {
    return this.edges.map(edge => {
      const source = this.nodes.get(edge.from)!
      const target = this.nodes.get(edge.to)!
      return {
        ...edge,
        sourceX: source.x,
        sourceY: source.y,
        targetX: target.x,
        targetY: target.y
      }
    })
  }

  getNeighbors(id: string): Node[] {
    const neighborIds = new Set<string>()

    for (const edge of this.edges) {
      if (edge.from === id) neighborIds.add(edge.to)
      if (edge.to === id) neighborIds.add(edge.from)
    }

    return Array.from(neighborIds).map(nid => this.nodes.get(nid)!)
  }

  layout(type: LayoutType = 'force'): Graph {
    switch (type) {
      case 'force':
        this.applyForceLayout()
        break
      case 'tree':
        this.applyTreeLayout()
        break
      case 'grid':
        this.applyGridLayout()
        break
      case 'circular':
        this.applyCircularLayout()
        break
    }
    return this
  }

  private applyForceLayout(): void {
    const nodes = this.getNodes()
    const padding = 50

    // Initialize random positions
    for (const node of nodes) {
      node.x = padding + Math.random() * (this.width - 2 * padding)
      node.y = padding + Math.random() * (this.height - 2 * padding)
    }

    // Simple force-directed simulation
    const iterations = 100
    const repulsion = 5000
    const attraction = 0.01
    const damping = 0.9

    for (let i = 0; i < iterations; i++) {
      const forces = new Map<string, { fx: number; fy: number }>()

      // Initialize forces
      for (const node of nodes) {
        forces.set(node.id, { fx: 0, fy: 0 })
      }

      // Repulsion between all nodes
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const a = nodes[j]
          const b = nodes[k]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = repulsion / (dist * dist)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force

          forces.get(a.id)!.fx -= fx
          forces.get(a.id)!.fy -= fy
          forces.get(b.id)!.fx += fx
          forces.get(b.id)!.fy += fy
        }
      }

      // Attraction along edges
      for (const edge of this.edges) {
        const a = this.nodes.get(edge.from)!
        const b = this.nodes.get(edge.to)!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const fx = dx * attraction
        const fy = dy * attraction

        forces.get(a.id)!.fx += fx
        forces.get(a.id)!.fy += fy
        forces.get(b.id)!.fx -= fx
        forces.get(b.id)!.fy -= fy
      }

      // Apply forces
      for (const node of nodes) {
        const f = forces.get(node.id)!
        node.x += f.fx * damping
        node.y += f.fy * damping

        // Keep within bounds
        node.x = Math.max(padding, Math.min(this.width - padding, node.x))
        node.y = Math.max(padding, Math.min(this.height - padding, node.y))
      }
    }
  }

  private applyTreeLayout(): void {
    const nodes = this.getNodes()
    if (nodes.length === 0) return

    // Find root (node with no incoming edges)
    const hasIncoming = new Set(this.edges.map(e => e.to))
    const root = nodes.find(n => !hasIncoming.has(n.id)) || nodes[0]

    // Build adjacency list (children only)
    const children = new Map<string, string[]>()
    for (const node of nodes) {
      children.set(node.id, [])
    }
    for (const edge of this.edges) {
      children.get(edge.from)?.push(edge.to)
    }

    // Calculate tree depth and positions
    const levels = new Map<string, number>()
    const positions = new Map<string, number>()

    const assignLevels = (id: string, level: number) => {
      levels.set(id, level)
      for (const childId of children.get(id) || []) {
        assignLevels(childId, level + 1)
      }
    }

    assignLevels(root.id, 0)

    // Count nodes at each level
    const levelCounts = new Map<number, number>()
    const levelIndex = new Map<string, number>()

    for (const [id, level] of levels) {
      const count = levelCounts.get(level) || 0
      levelIndex.set(id, count)
      levelCounts.set(level, count + 1)
    }

    // Assign positions
    const padding = 50
    const maxLevel = Math.max(...levels.values())
    const levelHeight = (this.height - 2 * padding) / Math.max(maxLevel, 1)

    for (const node of nodes) {
      const level = levels.get(node.id) || 0
      const index = levelIndex.get(node.id) || 0
      const count = levelCounts.get(level) || 1
      const levelWidth = (this.width - 2 * padding) / count

      node.x = padding + levelWidth * (index + 0.5)
      node.y = padding + levelHeight * level
    }
  }

  private applyGridLayout(): void {
    const nodes = this.getNodes()
    if (nodes.length === 0) return

    const cols = Math.ceil(Math.sqrt(nodes.length))
    const rows = Math.ceil(nodes.length / cols)
    const padding = 50

    const cellWidth = (this.width - 2 * padding) / cols
    const cellHeight = (this.height - 2 * padding) / rows

    nodes.forEach((node, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      node.x = padding + cellWidth * (col + 0.5)
      node.y = padding + cellHeight * (row + 0.5)
    })
  }

  private applyCircularLayout(): void {
    const nodes = this.getNodes()
    if (nodes.length === 0) return

    const centerX = this.width / 2
    const centerY = this.height / 2
    const radius = Math.min(this.width, this.height) / 2 - 50

    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
      node.x = centerX + radius * Math.cos(angle)
      node.y = centerY + radius * Math.sin(angle)
    })
  }
}
