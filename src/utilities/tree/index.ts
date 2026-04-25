type NodeData = Record<string, unknown>
type TraverseCallback = (node: TreeNode, depth: number) => void | boolean

interface TreeNode {
  id: string
  parentId: string | null
  data: NodeData
  children: string[]
}

export class Tree {
  private nodes: Map<string, TreeNode> = new Map()
  private rootId: string | null = null

  private constructor() {}

  static create(): Tree {
    return new Tree()
  }

  setRoot(id: string, data: NodeData = {}): Tree {
    const node: TreeNode = {
      id,
      parentId: null,
      data,
      children: []
    }
    this.nodes.set(id, node)
    this.rootId = id
    return this
  }

  addChild(parentId: string, id: string, data: NodeData = {}): Tree {
    const parent = this.nodes.get(parentId)
    if (!parent) {
      throw new Error(`Parent node '${parentId}' not found`)
    }

    if (this.nodes.has(id)) {
      throw new Error(`Node '${id}' already exists`)
    }

    const node: TreeNode = {
      id,
      parentId,
      data,
      children: []
    }

    this.nodes.set(id, node)
    parent.children.push(id)

    return this
  }

  removeNode(id: string): Tree {
    const node = this.nodes.get(id)
    if (!node) {
      throw new Error(`Node '${id}' not found`)
    }

    // Remove all descendants first
    for (const childId of [...node.children]) {
      this.removeNode(childId)
    }

    // Remove from parent's children
    if (node.parentId) {
      const parent = this.nodes.get(node.parentId)
      if (parent) {
        parent.children = parent.children.filter(c => c !== id)
      }
    }

    // Remove node
    this.nodes.delete(id)

    if (this.rootId === id) {
      this.rootId = null
    }

    return this
  }

  getNode(id: string): TreeNode | null {
    return this.nodes.get(id) || null
  }

  getRoot(): TreeNode | null {
    if (!this.rootId) return null
    return this.nodes.get(this.rootId) || null
  }

  getChildren(id: string): TreeNode[] {
    const node = this.nodes.get(id)
    if (!node) return []
    return node.children.map(cid => this.nodes.get(cid)!).filter(Boolean)
  }

  getParent(id: string): TreeNode | null {
    const node = this.nodes.get(id)
    if (!node || !node.parentId) return null
    return this.nodes.get(node.parentId) || null
  }

  getSiblings(id: string): TreeNode[] {
    const node = this.nodes.get(id)
    if (!node || !node.parentId) return []
    const parent = this.nodes.get(node.parentId)
    if (!parent) return []
    return parent.children
      .filter(cid => cid !== id)
      .map(cid => this.nodes.get(cid)!)
      .filter(Boolean)
  }

  getAncestors(id: string): TreeNode[] {
    const ancestors: TreeNode[] = []
    let current = this.nodes.get(id)

    while (current && current.parentId) {
      const parent = this.nodes.get(current.parentId)
      if (parent) {
        ancestors.push(parent)
        current = parent
      } else {
        break
      }
    }

    return ancestors
  }

  getDescendants(id: string): TreeNode[] {
    const descendants: TreeNode[] = []
    const node = this.nodes.get(id)
    if (!node) return descendants

    const collect = (nodeId: string) => {
      const n = this.nodes.get(nodeId)
      if (!n) return
      for (const childId of n.children) {
        const child = this.nodes.get(childId)
        if (child) {
          descendants.push(child)
          collect(childId)
        }
      }
    }

    collect(id)
    return descendants
  }

  getDepth(id: string): number {
    return this.getAncestors(id).length
  }

  getPath(id: string): TreeNode[] {
    const ancestors = this.getAncestors(id)
    const node = this.nodes.get(id)
    if (!node) return []
    return [...ancestors.reverse(), node]
  }

  traverse(callback: TraverseCallback, order: 'pre' | 'post' = 'pre'): Tree {
    if (!this.rootId) return this

    const visit = (id: string, depth: number) => {
      const node = this.nodes.get(id)
      if (!node) return

      if (order === 'pre') {
        const stop = callback(node, depth)
        if (stop === false) return
      }

      for (const childId of node.children) {
        visit(childId, depth + 1)
      }

      if (order === 'post') {
        callback(node, depth)
      }
    }

    visit(this.rootId, 0)
    return this
  }

  find(predicate: (node: TreeNode) => boolean): TreeNode | null {
    for (const node of this.nodes.values()) {
      if (predicate(node)) return node
    }
    return null
  }

  findAll(predicate: (node: TreeNode) => boolean): TreeNode[] {
    const results: TreeNode[] = []
    for (const node of this.nodes.values()) {
      if (predicate(node)) results.push(node)
    }
    return results
  }

  move(id: string, newParentId: string): Tree {
    const node = this.nodes.get(id)
    const newParent = this.nodes.get(newParentId)

    if (!node) throw new Error(`Node '${id}' not found`)
    if (!newParent) throw new Error(`Parent node '${newParentId}' not found`)
    if (id === newParentId) throw new Error('Cannot move node to itself')

    // Check if new parent is a descendant of node
    const descendants = this.getDescendants(id)
    if (descendants.some(d => d.id === newParentId)) {
      throw new Error('Cannot move node to its own descendant')
    }

    // Remove from old parent
    if (node.parentId) {
      const oldParent = this.nodes.get(node.parentId)
      if (oldParent) {
        oldParent.children = oldParent.children.filter(c => c !== id)
      }
    }

    // Add to new parent
    node.parentId = newParentId
    newParent.children.push(id)

    return this
  }

  toArray(): TreeNode[] {
    return Array.from(this.nodes.values())
  }

  size(): number {
    return this.nodes.size
  }
}
