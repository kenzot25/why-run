import { AsyncLocalStorage } from "async_hooks"

export interface TraceNode {
  id: string
  name: string
  timestamp: number
  parentId?: string
  children: string[]
  reason?: string
  duration?: number
  meta?: {
    file?: string
    line?: number
  }
}

interface TraceContext {
  node: TraceNode
}

const asyncLocalStorage = new AsyncLocalStorage<TraceContext>()

class TraceStore {
  nodes = new Map<string, TraceNode>()
  maxSize = 1000

  add(node: TraceNode) {
    if (this.nodes.size >= this.maxSize) {
      const firstKey = this.nodes.keys().next().value
      if (firstKey !== undefined) {
        this.nodes.delete(firstKey)
      }
    }
    this.nodes.set(node.id, node)
  }

  get(id: string): TraceNode | undefined {
    return this.nodes.get(id)
  }

  getAll(): TraceNode[] {
    return Array.from(this.nodes.values())
  }

  getChain(nodeId: string): TraceNode[] {
    const chain: TraceNode[] = []
    let current = this.nodes.get(nodeId)

    while (current) {
      chain.unshift(current)
      current = current.parentId ? this.nodes.get(current.parentId) : undefined
    }

    return chain
  }
}

export const store = new TraceStore()

export function trace<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T {
  return function (this: any, ...args: any[]) {
    const parent = asyncLocalStorage.getStore()
    const startTime = Date.now()

    const node: TraceNode = {
      id: `${name}-${startTime}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      timestamp: startTime,
      parentId: parent?.node.id,
      children: [],
    }

    if (parent) {
      parent.node.children.push(node.id)
    }

    store.add(node)

    const context: TraceContext = { node }

    return asyncLocalStorage.run(context, () => {
      try {
        const result = fn.apply(this, args)

        if (result instanceof Promise) {
          return result.finally(() => {
            node.duration = Date.now() - startTime
          })
        }

        node.duration = Date.now() - startTime
        return result
      } catch (error) {
        node.duration = Date.now() - startTime
        throw error
      }
    })
  } as T
}

export function getCurrentContext(): TraceNode | undefined {
  return asyncLocalStorage.getStore()?.node
}
