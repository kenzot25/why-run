import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTracedCallback, useTracedEffect } from "./index";
import { store } from "@why-run/core";
describe("@why-run/react", () => {
    beforeEach(() => {
        store.nodes.clear();
    });
    describe("useTracedCallback", () => {
        it("should wrap callback with trace", async () => {
            const callback = vi.fn(() => "result");
            const { result } = renderHook(() => useTracedCallback("testCallback", callback, []));
            result.current();
            await waitFor(() => {
                expect(store.getAll().some(n => n.name === "testCallback")).toBe(true);
            });
            expect(callback).toHaveBeenCalled();
        });
        it("should pass through arguments", () => {
            const callback = vi.fn((a, b) => `${a}-${b}`);
            const { result } = renderHook(() => useTracedCallback("argsCallback", callback, []));
            const r = result.current(42, "test");
            expect(r).toBe("42-test");
        });
        it("should update when deps change", () => {
            let dep = 0;
            const callback = vi.fn(() => dep);
            const { result, rerender } = renderHook(({ d }) => useTracedCallback("depCallback", callback, [d]), { initialProps: { d: dep } });
            result.current();
            dep = 1;
            rerender({ d: dep });
            result.current();
            expect(callback).toHaveBeenCalledTimes(2);
        });
    });
    describe("useTracedEffect", () => {
        it("should wrap effect with trace", async () => {
            const effect = vi.fn(() => {
                return () => { }; // cleanup
            });
            renderHook(() => useTracedEffect("testEffect", effect, []));
            await waitFor(() => {
                expect(effect).toHaveBeenCalled();
            });
            await waitFor(() => {
                expect(store.getAll().some(n => n.name === "testEffect")).toBe(true);
            });
        });
        it("should handle effects with async operations", async () => {
            const asyncOperation = vi.fn(async () => {
                await new Promise(r => setTimeout(r, 10));
                return "async";
            });
            renderHook(() => useTracedEffect("asyncEffect", () => {
                asyncOperation();
            }, []));
            await waitFor(() => {
                expect(asyncOperation).toHaveBeenCalled();
            });
        });
    });
});
//# sourceMappingURL=index.test.js.map