# @kenzot25/why-run

CLI for why-run - trace function calls to understand why they ran.

## Installation

```bash
npm install -g @kenzot25/why-run
```

Or use via npx:

```bash
npx @kenzot25/why-run <command>
```

## Commands

### `install-skill`

Install the why-run-debugger Claude Code skill to enable AI-powered trace analysis.

```bash
why-run install-skill
# or
npx @kenzot25/why-run install-skill
```

This copies the skill files to `~/.claude/skills/why-run-debugger/`, allowing Claude Code to:

- Debug call chains: "why did fetchUser run?"
- Analyze performance: "what's slow?"
- Explain errors: "why did this error happen?"
- Help understand code: "help me understand this file"

## Usage After Installing Skill

Once the skill is installed, open Claude Code and ask:

| Question                  | What Claude Will Do                           |
| ------------------------- | --------------------------------------------- |
| "why did fetchUser run?"  | Show ASCII call tree + causal explanation     |
| "analyze my traces"       | Complete analysis with performance breakdown  |
| "what's slow in my code?" | Highlight slow functions with recommendations |
| "debug this error"        | Trace error to root cause                     |

## About why-run

`why-run` is a function call tracing library that helps you understand the causal chain of function execution. See the [main repository](https://github.com/kenzot25/why-run) for full documentation.

## License

MIT
