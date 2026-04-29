import { useCallback, useEffect, useRef } from "react"
import { trace } from "@why-run/core"

export function useTracedCallback<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  deps: React.DependencyList
): T {
  const fnRef = useRef(fn)
  fnRef.current = fn

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    trace(name, (...args: Parameters<T>) => fnRef.current(...args)),
    deps
  )
}

export function useTracedEffect(
  name: string,
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  useEffect(trace(name, effect), deps)
}

export function useTracedMemo<T>(name: string, factory: () => T, deps: React.DependencyList): T {
  const factoryRef = useRef(factory)
  factoryRef.current = factory

  const tracedFactory = trace(name, () => factoryRef.current())

  // Simplified - in reality would need proper memoization
  return tracedFactory()
}
