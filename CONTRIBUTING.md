# Contributing to why-run

Thank you for your interest in contributing!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/your-username/why-run.git
cd why-run

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

## Project Structure

- `packages/core` - Core tracing functionality
- `packages/panel` - Floating UI panel
- `packages/react` - React hooks integration
- `examples/react-demo` - Demo application

## Making Changes

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Add tests for new functionality
4. Ensure tests pass: `npm test`
5. Build packages: `npm run build`
6. Submit a pull request

## Commit Message Format

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring

Example: `feat: add filter by duration to panel`

## Code Style

- TypeScript for all code
- Use existing patterns in the codebase
- Keep functions small and focused
- Add types for all public APIs

## Testing

- Write tests for new features
- Run `npm test` before submitting PR
- Test in both Node.js and browser environments where applicable
