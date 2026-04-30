# why-run

Trace function calls to understand **why they ran**.

## Quick Start

```bash
npm install why-run
```

```ts
import { trace } from "why-run"
import { initPanel } from "why-run/panel"
import "why-run/panel/style.css"

// Start the debug panel (Ctrl+Shift+W)
initPanel()

// Wrap functions you want to trace
const fetchUser = trace("fetchUser", async (id: string) => {
  return await api.get(`/user/${id}`)
})

const onClick = trace("onClick", () => {
  fetchUser(123)
})

// After clicking, open the panel to see:
// fetchUser
//   ← onClick
```

## How It Works

1. Wrap functions with `trace(name, fn)`
2. Interact with your app normally
3. Press `Ctrl+Shift+W` to open the trace panel
4. See the exact chain of calls that led to each function

## Packages

| Package          | Description                |
| ---------------- | -------------------------- |
| `@why-run/core`  | Core tracing functionality |
| `@why-run/panel` | Floating debug panel UI    |
| `@why-run/react` | React hooks integration    |

## React Example

```tsx
import { useTracedCallback } from "@why-run/react"

function Component() {
  const handleClick = useTracedCallback(
    "handleClick",
    async () => {
      await fetchUser(123)
    },
    []
  )

  return <button onClick={handleClick}>Load User</button>
}
```

## Claude Code Skill (Optional)

Install the `why-run-debugger` skill to get AI-powered analysis of your traces:

```bash
npx why-run install-skill
```

Once installed, ask Claude questions like:

- "why did fetchUser run?"
- "analyze my traces"
- "what's slow in my code?"
- "help me understand this call chain"

The skill automatically finds your trace exports and provides visual call trees + performance insights.

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run demo
pnpm --filter why-run-react-demo dev
```

## License

MIT
