// Browser-compatible async context implementation
// Falls back to simple stack-based tracking when AsyncLocalStorage is not available

export interface ContextStore<T> {
  getStore(): T | undefined
  run<R>(context: T, fn: () => R): R
}

class NodeAsyncLocalStorage<T> implements ContextStore<T> {
  private als: any

  constructor() {
    try {
      // Dynamic import to avoid browser bundling issues
      const { AsyncLocalStorage } = require("async_hooks")
      this.als = new AsyncLocalStorage<T>()
    } catch {
      throw new Error("AsyncLocalStorage not available")
    }
  }

  getStore(): T | undefined {
    return this.als.getStore()
  }

  run<R>(context: T, fn: () => R): R {
    return this.als.run(context, fn)
  }
}

// Browser-compatible implementation using zone-like approach
class BrowserContextStore<T> implements ContextStore<T> {
  private currentContext: T | undefined

  getStore(): T | undefined {
    return this.currentContext
  }

  run<R>(context: T, fn: () => R): R {
    const prevContext = this.currentContext
    this.currentContext = context
    try {
      const result = fn()

      // Handle promises to maintain context through async operations
      if (result instanceof Promise) {
        return new Promise((resolve, reject) => {
          result.then(
            (value) => {
              this.currentContext = context
              try {
                resolve(value)
              } finally {
                this.currentContext = prevContext
              }
            },
            (error) => {
              this.currentContext = context
              try {
                reject(error)
              } finally {
                this.currentContext = prevContext
              }
            }
          )
        }) as R
      }

      return result
    } finally {
      this.currentContext = prevContext
    }
  }
}

// Detect environment and use appropriate implementation
function createContextStore<T>(): ContextStore<T> {
  // Check if we're in Node.js
  const isNode =
    typeof process !== "undefined" &&
    process.versions != null &&
    process.versions.node != null

  if (isNode) {
    try {
      return new NodeAsyncLocalStorage<T>()
    } catch {
      console.warn("AsyncLocalStorage not available, falling back to browser implementation")
      return new BrowserContextStore<T>()
    }
  }

  return new BrowserContextStore<T>()
}

export const contextStore = createContextStore()
