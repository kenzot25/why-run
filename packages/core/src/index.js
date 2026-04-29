import { AsyncLocalStorage } from "async_hooks";
const asyncLocalStorage = new AsyncLocalStorage();
class TraceStore {
    constructor() {
        this.nodes = new Map();
        this.maxSize = 1000;
    }
    add(node) {
        if (this.nodes.size >= this.maxSize) {
            const firstKey = this.nodes.keys().next().value;
            this.nodes.delete(firstKey);
        }
        this.nodes.set(node.id, node);
    }
    get(id) {
        return this.nodes.get(id);
    }
    getAll() {
        return Array.from(this.nodes.values());
    }
    getChain(nodeId) {
        const chain = [];
        let current = this.nodes.get(nodeId);
        while (current) {
            chain.unshift(current);
            current = current.parentId ? this.nodes.get(current.parentId) : undefined;
        }
        return chain;
    }
}
export const store = new TraceStore();
export function trace(name, fn) {
    return function (...args) {
        const parent = asyncLocalStorage.getStore();
        const startTime = Date.now();
        const node = {
            id: `${name}-${startTime}-${Math.random().toString(36).slice(2, 9)}`,
            name,
            timestamp: startTime,
            parentId: parent?.node.id,
            children: [],
        };
        if (parent) {
            parent.node.children.push(node.id);
        }
        store.add(node);
        const context = { node };
        return asyncLocalStorage.run(context, () => {
            try {
                const result = fn.apply(this, args);
                if (result instanceof Promise) {
                    return result.finally(() => {
                        node.duration = Date.now() - startTime;
                    });
                }
                node.duration = Date.now() - startTime;
                return result;
            }
            catch (error) {
                node.duration = Date.now() - startTime;
                throw error;
            }
        });
    };
}
export function getCurrentContext() {
    return asyncLocalStorage.getStore()?.node;
}
//# sourceMappingURL=index.js.map