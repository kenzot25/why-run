# why-run-debugger Claude Code Skill

AI-powered debugging skill for analyzing why-run traces in Claude Code.

## What This Skill Does

When installed, this skill enables Claude to:

- **Debug call chains**: "why did fetchUser run?" → Shows the complete causal chain
- **Analyze performance**: "what's slow?" → Identifies bottlenecks with heatmap visualization
- **Explain errors**: "why did this error happen?" → Traces error origins through the call stack
- **Annotate code**: "help me understand this file" → Suggests trace points for code exploration

## Installation

```bash
npx @kenzot25/why-run install-skill
```

## Usage Examples

After installing, open Claude Code in any project that uses why-run and ask:

| Question                       | What You'll Get                                    |
| ------------------------------ | -------------------------------------------------- |
| "why did fetchUser run?"       | ASCII call tree + explanation of the trigger chain |
| "analyze my traces"            | Complete analysis with performance breakdown       |
| "what's slow in my code?"      | Slowest functions highlighted with recommendations |
| "debug this error"             | Error chain traced to root cause                   |
| "help me understand this file" | Suggested trace points + annotated code            |

## How It Works

1. **Auto-discovery**: Claude looks for exported trace files (`why-run-trace.json`) or why-run in your project
2. **Chain building**: Parses parent-child relationships to build the complete call graph
3. **Analysis**: Calculates duration percentiles, identifies hot spots, traces errors
4. **Visualization**: Outputs ASCII trees with duration indicators (🟢🟡🟠🔴)

## Requirements

- Claude Code installed
- A project using `why-run` (or trace export files)

## Files

- `SKILL.md` - The skill definition that Claude uses
