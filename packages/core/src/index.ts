import { contextStore as rawContextStore } from "./async-context"

export interface TraceNode {
  id: string
  name: string
  timestamp: number
  parentId?: string
  children: string[]
  reason?: string
  duration?: number
  status?: "success" | "error"
  error?: string
  meta?: {
    file?: string
    line?: number
  }
}

interface TraceContext {
  node: TraceNode
}

const contextStore = rawContextStore as {
  getStore(): TraceContext | undefined
  run<R>(context: TraceContext, fn: () => R): R
}

// Use performance.now() for high-resolution timing (microsecond precision)
const getTimestamp =
  typeof performance !== "undefined" && performance.now
    ? () => performance.now()
    : () => Date.now()

class TraceStore {
  nodes = new Map<string, TraceNode>()
  maxSize = 1000
  private evictionCount = 0
  private totalAdded = 0

  add(node: TraceNode) {
    this.totalAdded++
    if (this.nodes.size >= this.maxSize) {
      const firstKey = this.nodes.keys().next().value
      if (firstKey !== undefined) {
        this.nodes.delete(firstKey)
        this.evictionCount++
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

  /**
   * Get store statistics for debugging and monitoring
   */
  getStats() {
    const nodes = this.getAll()
    const timestamps = nodes.map((n) => n.timestamp)
    const oldestTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : 0
    const newestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0

    return {
      size: this.nodes.size,
      maxSize: this.maxSize,
      utilization: Math.round((this.nodes.size / this.maxSize) * 100),
      evictionCount: this.evictionCount,
      totalAdded: this.totalAdded,
      oldestTimestamp,
      newestTimestamp,
      ageSpan: newestTimestamp - oldestTimestamp,
      errorCount: nodes.filter((n) => n.status === "error").length,
      successCount: nodes.filter((n) => n.status === "success").length,
      pendingCount: nodes.filter((n) => !n.status).length,
    }
  }

  /**
   * Export all traces to JSON for offline analysis
   */
  export(): string {
    return JSON.stringify(
      {
        version: "1.0",
        exportedAt: Date.now(),
        stats: this.getStats(),
        nodes: this.getAll(),
      },
      null,
      2
    )
  }

  /**
   * Import traces from JSON (merges with existing, respects maxSize)
   */
  import(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        for (const node of parsed.nodes) {
          if (node.id && !this.nodes.has(node.id)) {
            this.add(node as TraceNode)
          }
        }
        return true
      }
    } catch {
      // Invalid data
    }
    return false
  }
}

export const store = new TraceStore()

export function trace<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T {
  return function (this: any, ...args: any[]) {
    const parent = contextStore.getStore()
    const startTime = getTimestamp()

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

    return contextStore.run(context, () => {
      try {
        const result = fn.apply(this, args)

        if (result instanceof Promise) {
          return result
            .then((value) => {
              node.duration = getTimestamp() - startTime
              node.status = "success"
              return value
            })
            .catch((error) => {
              node.duration = getTimestamp() - startTime
              node.status = "error"
              node.error = error instanceof Error ? error.message : String(error)
              throw error
            })
        }

        node.duration = getTimestamp() - startTime
        node.status = "success"
        return result
      } catch (error) {
        node.duration = getTimestamp() - startTime
        node.status = "error"
        node.error = error instanceof Error ? error.message : String(error)
        throw error
      }
    })
  } as T
}

export function getCurrentContext(): TraceNode | undefined {
  return contextStore.getStore()?.node
}
