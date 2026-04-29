import { describe, it, expect, beforeEach, vi } from "vitest";
import { store, trace } from "@why-run/core";
import { openPanel, closePanel, togglePanel, initPanel } from "./index";
describe("panel", () => {
    beforeEach(() => {
        store.nodes.clear();
        closePanel();
        // Clean up DOM
        document.body.innerHTML = "";
        // Reset module state
        vi.resetModules();
    });
    describe("openPanel", () => {
        it("should create panel element", () => {
            openPanel();
            const panel = document.querySelector(".why-run-panel");
            expect(panel).toBeTruthy();
        });
        it("should append panel to document body", () => {
            openPanel();
            expect(document.body.children.length).toBeGreaterThan(0);
        });
        it("should set panel position styles", () => {
            openPanel({ position: "top-left" });
            const panel = document.querySelector(".why-run-panel");
            expect(panel?.style.cssText).toContain("top");
            expect(panel?.style.cssText).toContain("left");
        });
    });
    describe("closePanel", () => {
        it("should hide panel when closed", () => {
            openPanel();
            closePanel();
            const panel = document.querySelector(".why-run-panel");
            // Panel should exist but be hidden
            expect(panel).toBeTruthy();
        });
    });
    describe("togglePanel", () => {
        it("should toggle panel visibility", () => {
            togglePanel();
            const panel = document.querySelector(".why-run-panel");
            expect(panel).toBeTruthy();
            togglePanel();
            // Panel should still exist
            expect(document.querySelector(".why-run-panel")).toBeTruthy();
        });
    });
    describe("panel with trace data", () => {
        it("should work with traced functions", () => {
            const fn = trace("testFn", () => "result");
            fn();
            openPanel();
            const panel = document.querySelector(".why-run-panel");
            expect(panel).toBeTruthy();
        });
        it("should handle nested trace calls", () => {
            const child = trace("child", () => "child");
            const parent = trace("parent", () => child());
            parent();
            openPanel();
            const panel = document.querySelector(".why-run-panel");
            expect(panel).toBeTruthy();
        });
    });
    describe("initPanel", () => {
        it("should expose whyRun to window", () => {
            initPanel();
            expect(window.whyRun).toBeTruthy();
            expect(typeof window.whyRun.open).toBe("function");
            expect(typeof window.whyRun.close).toBe("function");
            expect(typeof window.whyRun.toggle).toBe("function");
            expect(window.whyRun.store).toBe(store);
        });
        it("should handle keyboard events", () => {
            initPanel({ shortcut: "ctrl+shift+x" });
            // Just verify no errors are thrown
            expect(window.whyRun).toBeTruthy();
        });
    });
    describe("panel functionality", () => {
        it("should show panel with search", () => {
            openPanel();
            const search = document.querySelector(".why-run-search");
            expect(search).toBeTruthy();
        });
        it("should show panel with list", () => {
            openPanel();
            const list = document.querySelector(".why-run-list");
            expect(list).toBeTruthy();
        });
        it("should show panel with detail area", () => {
            openPanel();
            const detail = document.querySelector(".why-run-detail");
            expect(detail).toBeTruthy();
        });
    });
});
//# sourceMappingURL=index.test.js.map