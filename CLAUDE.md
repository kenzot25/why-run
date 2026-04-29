# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests for all packages
pnpm test

# Run tests for a specific package
pnpm --filter @why-run/core test

# Run the React demo
pnpm --filter why-run-react-demo dev

# Lint
pnpm lint

# Type check
pnpm typecheck
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

1. **`trace(name, fn)`** wraps a function and uses Node's `AsyncLocalStorage` to propagate context through async boundaries
2. Each call creates a `TraceNode` with `parentId` linking to the calling function
3. `store.getChain(nodeId)` walks `parentId` links to build the causal chain
4. **Panel** renders the chain by querying `store` and building HTML with the chain items

### Key Design Decisions

- **AsyncLocalStorage is required** — not optional. Manual context tracking fails with async/await
- **Store has a hard limit** (`maxSize: 1000`) to prevent memory leaks in long-running apps
- **Panel is vanilla JS** — no framework dependency so it works with any frontend
- **React hooks use refs** — the `fnRef` pattern ensures fresh closures without breaking `useCallback` memoization

### Cross-Package Dependencies

```
@why-run/react → depends on → @why-run/core
@why-run/panel → depends on → @why-run/core
```

The demo app (`examples/react-demo`) imports from all three packages to show the full integration.
