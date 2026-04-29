export declare function useTracedCallback<T extends (...args: any[]) => any>(name: string, fn: T, deps: React.DependencyList): T;
export declare function useTracedEffect(name: string, effect: React.EffectCallback, deps?: React.DependencyList): void;
export declare function useTracedMemo<T>(name: string, factory: () => T, deps: React.DependencyList): T;
//# sourceMappingURL=index.d.ts.map