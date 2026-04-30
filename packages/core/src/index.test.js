import { describe, it, expect, beforeEach } from "vitest";
import { trace, store, getCurrentContext } from "./index";
describe("trace", () => {
    beforeEach(() => {
        store.nodes.clear();
    });
    describe("basic tracing", () => {
        it("should create trace nodes", async () => {
            const fn = trace("testFn", (x) => x * 2);
            const result = fn(5);
            expect(result).toBe(10);
            expect(store.getAll().length).toBe(1);
            expect(store.getAll()[0].name).toBe("testFn");
        });
        it("should track duration", async () => {
            const fn = trace("slowFn", async () => {
                await new Promise((resolve) => setTimeout(resolve, 20));
                return "done";
            });
            await fn();
            const node = store.getAll()[0];
            expect(node.duration).toBeGreaterThanOrEqual(5);
            expect(node.duration).toBeDefined();
        });
        it("should generate unique IDs", () => {
            const fn = trace("test", () => "result");
            fn();
            fn();
            const nodes = store.getAll();
            expect(nodes[0].id).not.toBe(nodes[1].id);
        });
    });
    describe("parent-child relationships", () => {
        it("should track nested calls", async () => {
            const child = trace("child", () => "child result");
            const parent = trace("parent", () => child());
            parent();
            const nodes = store.getAll();
            expect(nodes.length).toBe(2);
            const parentNode = nodes.find((n) => n.name === "parent");
            const childNode = nodes.find((n) => n.name === "child");
            expect(childNode?.parentId).toBe(parentNode?.id);
            expect(parentNode?.children).toContain(childNode?.id);
        });
        it("should handle multiple children", () => {
            const childA = trace("childA", () => "a");
            const childB = trace("childB", () => "b");
            const parent = trace("parent", () => {
                childA();
                childB();
            });
            parent();
            const parentNode = store.getAll().find((n) => n.name === "parent");
            expect(parentNode?.children.length).toBe(2);
        });
        it("should build chain correctly", async () => {
            const grandchild = trace("grandchild", () => "result");
            const child = trace("child", () => grandchild());
            const parent = trace("parent", () => child());
            parent();
            const grandchildNode = store.getAll().find((n) => n.name === "grandchild");
            const chain = store.getChain(grandchildNode.id);
            expect(chain.map((n) => n.name)).toEqual(["parent", "child", "grandchild"]);
        });
    });
    describe("async handling", () => {
        it("should track async functions", async () => {
            const asyncFn = trace("asyncFn", async () => {
                await new Promise((resolve) => setTimeout(resolve, 1));
                return "async result";
            });
            const result = await asyncFn();
            expect(result).toBe("async result");
            expect(store.getAll().length).toBe(1);
        });
        it("should maintain context through async boundaries", async () => {
            const grandchild = trace("asyncGrandchild", async () => {
                await new Promise((resolve) => setTimeout(resolve, 1));
                return "gc";
            });
            const child = trace("asyncChild", async () => {
                await new Promise((resolve) => setTimeout(resolve, 1));
                return await grandchild();
            });
            const parent = trace("asyncParent", async () => {
                await new Promise((resolve) => setTimeout(resolve, 1));
                return await child();
            });
            await parent();
            const grandchildNode = store.getAll().find((n) => n.name === "asyncGrandchild");
            const chain = store.getChain(grandchildNode.id);
            expect(chain.map((n) => n.name)).toEqual(["asyncParent", "asyncChild", "asyncGrandchild"]);
        });
        it("should handle parallel async calls", async () => {
            const task = trace("task", async (id) => id);
            const parent = trace("parallelParent", async () => {
                return await Promise.all([task(1), task(2), task(3)]);
            });
            await parent();
            const nodes = store.getAll();
            const parentNode = nodes.find((n) => n.name === "parallelParent");
            const taskNodes = nodes.filter((n) => n.name === "task");
            expect(taskNodes.length).toBe(3);
            expect(taskNodes.every((n) => n.parentId === parentNode?.id)).toBe(true);
        });
    });
    describe("error handling", () => {
        it("should still track duration when function throws", () => {
            const fn = trace("errorFn", () => {
                throw new Error("test error");
            });
            expect(() => fn()).toThrow("test error");
            const node = store.getAll()[0];
            expect(node.duration).toBeDefined();
            expect(node.duration).toBeGreaterThanOrEqual(0);
        });
        it("should still track duration when async function rejects", async () => {
            const fn = trace("asyncError", async () => {
                await new Promise((_, reject) => setTimeout(reject, 1, new Error("async error")));
            });
            await expect(fn()).rejects.toThrow("async error");
            const node = store.getAll()[0];
            expect(node.duration).toBeDefined();
        });
    });
    describe("store limits", () => {
        it("should enforce maxSize limit", () => {
            // Temporarily reduce maxSize for testing
            const originalMaxSize = store.maxSize;
            store.maxSize = 3;
            const fn = trace("limited", () => "x");
            fn();
            fn();
            fn();
            fn();
            expect(store.getAll().length).toBe(3);
            store.maxSize = originalMaxSize;
        });
    });
    describe("getCurrentContext", () => {
        it("should return undefined outside of trace", () => {
            expect(getCurrentContext()).toBeUndefined();
        });
        it("should return current node inside trace", () => {
            const fn = trace("contextTest", () => {
                return getCurrentContext();
            });
            const context = fn();
            expect(context?.name).toBe("contextTest");
        });
    });
    describe("this binding", () => {
        it("should preserve this context", () => {
            const obj = {
                value: 42,
                method: trace("method", function () {
                    return this.value;
                }),
            };
            expect(obj.method()).toBe(42);
        });
    });
});
describe("TraceNode interface", () => {
    it("should support all defined properties", () => {
        const node = {
            id: "test-123",
            name: "test",
            timestamp: Date.now(),
            parentId: "parent-456",
            children: ["child-789"],
            reason: "onClick",
            duration: 100,
            meta: {
                file: "test.ts",
                line: 42,
            },
        };
        expect(node.id).toBe("test-123");
        expect(node.name).toBe("test");
        expect(node.meta?.file).toBe("test.ts");
    });
});
//# sourceMappingURL=index.test.js.map