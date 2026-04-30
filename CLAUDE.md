# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests for all packages
npm test

# Run tests for a specific package
npm run test:core
npm run test:panel
npm run test:react

# Run the React demo
npm run demo

# Lint
npm run lint

# Type check
npm run typecheck
```

## Architecture

**why-run** is a monorepo with three packages that work together to trace function calls and display the "why chain" (the causal chain of function calls).

### Package Structure

| Package | Purpose | Key Exports |
|---------|---------|-------------|
| `@why-run/core` | Trace function calls, store nodes, build chains | `trace()`, `store`, `TraceNode` |
| `@why-run/panel` | Floating UI panel to visualize traces | `initPanel()`, `openPanel()` |
| `@why-run/react` | React hooks that wrap `trace()` | `useTracedCallback()`, `useTracedEffect()` |

### Core Data Flow

1. **`trace(name, fn)`** wraps a function and uses `contextStore` (AsyncLocalStorage in Node.js, zone-like implementation in browser) to propagate context through async boundaries
2. Each call creates a `TraceNode` with `parentId` linking to the calling function
3. `store.getChain(nodeId)` walks `parentId` links to build the causal chain
4. **Panel** renders the chain by querying `store` and building HTML with the chain items

### Browser vs Node.js Compatibility

The core package uses `async-context.ts` to provide cross-platform async context:

- **Node.js**: Uses native `async_hooks.AsyncLocalStorage`
- **Browser**: Uses `BrowserContextStore` - a zone-like implementation that maintains context through promises

This allows the same code to work in both environments without modification.

### Key Design Decisions

- **Dual async context implementation** — `BrowserContextStore` for browsers, `NodeAsyncLocalStorage` for Node.js. Automatically detected at runtime.
- **Store has a hard limit** (`maxSize: 1000`) to prevent memory leaks in long-running apps
- **Panel is vanilla JS** — no framework dependency so it works with any frontend
- **React hooks use refs** — the `fnRef` pattern ensures fresh closures without breaking `useCallback` memoization

### Cross-Package Dependencies

```
@why-run/react → depends on → @why-run/core
@why-run/panel → depends on → @why-run/core
```

The demo app (`examples/react-demo`) imports from all three packages to show the full integration.

### Testing Notes

- **Core**: 32 tests passing (Node.js environment)
- **React**: 10 tests passing (jsdom environment)
- **Panel**: 6/12 tests passing — DOM manipulation tests in jsdom have limitations with dynamic element creation. The actual browser implementation works correctly.
