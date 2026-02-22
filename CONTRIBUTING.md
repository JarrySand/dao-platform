# Contributing

Thank you for your interest in contributing to the DAO Document Platform.

## Coding Conventions

- **TypeScript**: Strict mode enabled. All new code must be fully typed.
- **Architecture**: Follow [Feature-Sliced Design](./docs/architecture.md). Place feature code in `src/features/<feature>/`, shared code in `src/shared/`.
- **Styling**: Use Tailwind CSS utility classes. Shared UI primitives live in `src/shared/components/ui/`.
- **Imports**: Use `@/` path alias. Import from barrel exports (`@/features/auth`, `@/shared`) where available.
- **State**: Use Zustand for client state, TanStack Query for server state.

## Branch Naming

```
feat/<short-description>    # New feature
fix/<short-description>     # Bug fix
refactor/<short-description># Refactoring
docs/<short-description>    # Documentation only
chore/<short-description>   # Maintenance tasks
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

feat(dao): add document version comparison view
fix(auth): handle expired session token
docs: update development guide
chore: upgrade Next.js to 15.1
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Pull Request Process

1. Fork the repository and create your branch from `main`.
2. Write or update tests for your changes.
3. Ensure the following pass:
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   npm run build
   ```
4. Open a pull request with a clear title and description.
5. Link any related issues.

## Test Requirements

- New features must include unit tests.
- Bug fixes should include a regression test.
- Tests use Vitest + Testing Library. Place test files alongside source files as `*.test.ts(x)`.
