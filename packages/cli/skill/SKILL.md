---
name: why-run-debugger
description: |
  Debug and analyze JavaScript/TypeScript function call chains using why-run traces.
  Use this skill when the user asks "why did X run", "why was Y called", "analyze traces",
  "debug why", "trace performance", "explain call chain", or mentions call stacks,
  function chains, or causal chains in their code. Also triggers for "what's slow",
  "performance bottleneck", or "help me understand this code" when why-run is available.
  Automatically discovers trace data and provides visual call tree + analysis.
---

# why-run-debugger

Debug and analyze JavaScript/TypeScript function call chains using why-run traces.

## When to Use

This skill is designed for debugging scenarios where you need to understand:

- **Causality**: Why did a specific function execute?
- **Chains**: What series of calls led to this point?
- **Performance**: Which calls are taking the most time?
- **Errors**: Where did the error originate in the call chain?
- **Code understanding**: What's the flow through an unfamiliar codebase?

Trigger phrases include:

- "why did X run" / "why was X called"
- "analyze traces" / "debug why"
- "explain the call chain"
- "what's slow" / "performance bottleneck"
- "help me understand this code" (when why-run is available)

## How It Works

### 1. Discover Trace Data

First, try to locate trace data in this order:

**a) Exported trace file** (most common)

- Look for `why-run-trace.json`, `trace-export.json`, or similar in:
  - Current working directory
  - Project root (where package.json is)
  - User's Downloads or Desktop (common export locations)
  - Any recent JSON files the user mentioned

**b) Live why-run integration**

- Check if the current project has `@why-run/core` installed
- If yes, explain how to export: `store.export()` or use the panel's export button

**c) Inline traces in code**

- If user shares code with `trace()` calls already present, note that traces need to be exported first

### 2. Parse and Validate

Once you find trace data:

- Parse the JSON (handle gracefully if malformed)
- Validate structure: should have `nodes` array with `id`, `name`, `parentId`, `timestamp`
- Extract metadata: `exportedAt`, `stats` if available

### 3. Build Call Chains

For the function in question (or all root functions if no specific target):

```
Chain building algorithm:
1. Find the target node by name (handle multiple matches by recency)
2. Walk parentId links upward to build the complete ancestry chain
3. Walk children arrays downward to show what the function triggered
4. Sort by timestamp to maintain chronological order
```

### 4. Analyze

**Duration analysis:**

- Calculate duration percentiles across all nodes
- Flag nodes in top 20% as "slow"
- Flag nodes >100ms as "very slow"
- Flag nodes >500ms as "critical"

**Error analysis:**

- Collect all nodes with `status === "error"`
- Build error chains to show propagation
- Highlight the root cause (earliest error in chain)

**Frequency analysis:**

- Count function call frequency
- Flag functions called >10x as "hot spots"

### 5. Output Format

Always provide three sections:

#### A) Visual Call Tree (ASCII)

```
fetchUser (45ms) 🟢
  ← handleClick (12ms) 🟢
    ← onButtonClick (8ms) 🟢
      ← [root] (2ms) 🟢
```

Use these indicators:

- 🟢 < 10ms (fast)
- 🟡 10-50ms (moderate)
- 🟠 50-100ms (slow)
- 🔴 > 100ms or error (critical)
- ⚠️ Error occurred

#### B) Plain English Explanation

Summarize the causal chain:

- "`fetchUser` was called because `handleClick` triggered it"
- "The chain is 4 levels deep, originating from a button click"
- "This represents a user-initiated data fetch"

#### C) Performance Insights

If relevant:

- "The slowest call in this chain is `fetchUser` at 45ms"
- "3 parallel calls were made from `loadDashboard`"
- "Consider caching the user data to reduce repeated fetches"

### 6. Code Annotation (Optional)

If the user asks to "add traces" or "help me understand this file":

**a) Identify trace points:**

- Look for async functions (likely API calls)
- Look for event handlers
- Look for complex business logic functions

**b) Generate annotated code:**

```typescript
// TRACE-START: Temporary traces for debugging - remove when done
import { trace } from "why-run"

const fetchUser = trace("fetchUser", async (id: string) => {
  // TRACE-END
  return await api.get(`/user/${id}`)
})
```

**c) Provide removal command:**

```bash
# Remove all TRACE markers when done:
sed -i '' '/TRACE-START/,/TRACE-END/d' src/**/*.ts
# Or manually delete lines with TRACE comments
```

## Common Patterns

### Pattern 1: "Why did fetchUser run?"

1. Find `fetchUser` in the trace nodes (may have multiple instances)
2. For each instance, build the parent chain
3. Show the most recent or most frequent chain
4. Explain the trigger (user action, timer, etc.)

### Pattern 2: "What's slow?"

1. Load all nodes
2. Sort by duration (descending)
3. Show top 10 slowest functions with their chains
4. Highlight patterns (e.g., "all slow calls involve database access")

### Pattern 3: "Why did this error happen?"

1. Find all nodes with `status === "error"`
2. Build chain for each error
3. Show the root cause (earliest error in the deepest chain)
4. Trace forward to show what the error prevented

### Pattern 4: "Help me understand this code"

1. Read the file(s) the user mentions
2. Identify key functions that would benefit from tracing
3. Generate annotated version with trace wrappers
4. Provide instructions on how to run and view traces

## Edge Cases

**No trace data found:**

- Ask the user to export traces or add why-run to their project
- Provide quick setup instructions

**Multiple functions with same name:**

- Show all instances with timestamps
- Let user specify which one they meant
- Or analyze the most recent

**Circular references:**

- Check for circular parentId chains (shouldn't happen with why-run)
- Break at reasonable depth limit (20 levels)

**Missing duration data:**

- Some nodes may not have duration (still running)
- Show as "⏳ pending" or omit duration

**Very large traces (>1000 nodes):**

- Use the `stats` summary if available
- Focus on the relevant subset (recent nodes or specific function)
- Suggest filtering in the export

## Integration with why-run Packages

The skill works with:

- `@why-run/core` - Parse exported JSON
- `@why-run/panel` - Reference the UI for visual debugging
- `@why-run/react` - Understand hook-based traces

Always mention that the panel (Ctrl+Shift+W) provides a real-time UI, while this skill provides deeper analysis.

## Example Output

```
## Call Chain Analysis: fetchUser

### Visual Tree
fetchUser (145ms) 🔴
  ← loadDashboard (12ms) 🟢
    ← onMount (5ms) 🟢
      ← [root] (1ms) 🟢

### Explanation
`fetchUser` was triggered during component mount when `loadDashboard`
attempted to fetch user data. This is a standard initialization pattern.

### Performance Note ⚠️
`fetchUser` at 145ms is significantly slower than other calls in this
chain. Consider:
- Adding caching to avoid repeated fetches
- Optimizing the API endpoint
- Showing a loading state during this call

### Error Status
✅ All calls completed successfully

---
To see this in real-time, use the why-run panel: Ctrl+Shift+W
```
