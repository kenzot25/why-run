import { useCallback, useEffect, useRef } from "react";
import { trace } from "@why-run/core";
export function useTracedCallback(name, fn, deps) {
    const fnRef = useRef(fn);
    fnRef.current = fn;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useCallback(trace(name, (...args) => fnRef.current(...args)), deps);
}
export function useTracedEffect(name, effect, deps) {
    useEffect(trace(name, effect), deps);
}
export function useTracedMemo(name, factory, deps) {
    const factoryRef = useRef(factory);
    factoryRef.current = factory;
    const tracedFactory = trace(name, () => factoryRef.current());
    // Simplified - in reality would need proper memoization
    return tracedFactory();
}
//# sourceMappingURL=index.js.map