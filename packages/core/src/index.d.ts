export interface TraceNode {
    id: string;
    name: string;
    timestamp: number;
    parentId?: string;
    children: string[];
    reason?: string;
    duration?: number;
    meta?: {
        file?: string;
        line?: number;
    };
}
declare class TraceStore {
    nodes: Map<string, TraceNode>;
    maxSize: number;
    add(node: TraceNode): void;
    get(id: string): TraceNode | undefined;
    getAll(): TraceNode[];
    getChain(nodeId: string): TraceNode[];
}
export declare const store: TraceStore;
export declare function trace<T extends (...args: any[]) => any>(name: string, fn: T): T;
export declare function getCurrentContext(): TraceNode | undefined;
export {};
//# sourceMappingURL=index.d.ts.map