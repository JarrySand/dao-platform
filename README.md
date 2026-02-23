# DAO Document Platform

A decentralized platform for managing DAO governance documents with blockchain-verified authenticity and immutability. Built on Ethereum Attestation Service (EAS) for trustless document verification.

> **Demo**: https://dao-doc-platform-demo.vercel.app/
>
> **Note**: This demo runs on **Ethereum Sepolia testnet**. This is an **alpha release** — use at your own risk.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand + TanStack Query
- **Blockchain**: Ethereum (Sepolia), EAS SDK, ethers.js v6
- **Storage**: IPFS (Pinata), Firebase Firestore
- **Auth**: Wallet Signature (ethers.js `verifyMessage`)
- **Testing**: Vitest, Testing Library, MSW
- **CI/CD**: GitHub Actions, Vercel, Dependabot

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd dao-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Public Users

- Browse and search registered DAOs
- View DAO governance documents (articles, minutes, proposals)
- Verify document authenticity against on-chain attestations
- View full document version history

### DAO Administrators

- Register and manage DAO profiles
- Upload and version governance documents (articles, minutes, proposals)
- Create blockchain attestations (EAS) for document integrity
- Store documents on IPFS for decentralized availability
- Link voting transaction hashes to proposals
- Revoke outdated documents

## Architecture

This project follows **Feature-Sliced Design (FSD)** principles:

```
src/
  app/          # Next.js App Router pages and layouts
  config/       # Application configuration
  features/     # Feature modules (auth, wallet, dao, document, dashboard)
    <feature>/
      api/        # API client functions
      components/ # Feature-specific UI components
      hooks/      # Feature-specific React hooks
      stores/     # Zustand state stores
      types/      # Feature-specific type definitions
  shared/       # Shared code used across features
    components/   # Reusable UI primitives
    constants/    # App-wide constants and routes
    hooks/        # Shared React hooks
    lib/          # External service clients (Firebase, EAS, IPFS)
    providers/    # React context providers
    types/        # Shared type definitions
    utils/        # Utility functions
  test/         # Test utilities and setup
```

## Environment Variables

Copy `.env.example` to `.env.local` and set the required values:

| Category        | Variables                                                  | Description                          |
| --------------- | ---------------------------------------------------------- | ------------------------------------ |
| Firebase Client | `NEXT_PUBLIC_FIREBASE_API_KEY`, `PROJECT_ID`, etc.         | Firestore access (client-side)       |
| Firebase Admin  | `FIREBASE_ADMIN_PROJECT_ID`, `CLIENT_EMAIL`, `PRIVATE_KEY` | Firestore access (server-side)       |
| EAS             | `NEXT_PUBLIC_DOCUMENT_V2_SCHEMA_UID`                       | EAS schema for document attestations |
| Ethereum        | `NEXT_PUBLIC_SEPOLIA_RPC_URL`                              | Sepolia RPC endpoint                 |
| IPFS            | `PINATA_JWT`                                               | Pinata API token for IPFS uploads    |
| App             | `NEXT_PUBLIC_APP_URL`                                      | Application URL (CORS allowlist)     |

## Security

- **Wallet Signature Auth**: Ethereum message signing with nonce + timestamp (5-minute expiry)
- **Rate Limiting**: IP-based rate limiting on all API endpoints
- **CORS**: Origin allowlist validation
- **Error Sanitization**: Internal error details hidden in production

## Testing

- **Framework**: Vitest + Testing Library + MSW (Mock Service Worker)
- **Coverage Threshold**: 80% minimum (branches, functions, lines, statements)
- **Test Files**: 24 files, 188+ tests

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report with threshold enforcement
```

## CI/CD

### Continuous Integration (GitHub Actions)

Runs on every push to `main` and all pull requests:

1. **Lint** — ESLint
2. **Type Check** — `tsc --noEmit`
3. **Test** — `vitest run --coverage` (80% threshold)
4. **Build** — Next.js production build (runs after lint/typecheck/test pass)

### Deployment

- **Vercel**: Auto-deploy on `v*` tags
- **Dependabot**: Weekly security scans for npm packages and GitHub Actions

## Available Scripts

| Command                 | Description                    |
| ----------------------- | ------------------------------ |
| `npm run dev`           | Start development server       |
| `npm run build`         | Create production build        |
| `npm run start`         | Start production server        |
| `npm run lint`          | Run ESLint                     |
| `npm run typecheck`     | Run TypeScript type checking   |
| `npm run test`          | Run tests                      |
| `npm run test:watch`    | Run tests in watch mode        |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run format`        | Format code with Prettier      |
| `npm run format:check`  | Check code formatting          |

## Documentation

- [Development Guide](./docs/DEVELOPMENT.md) - Detailed setup and development instructions
- [Architecture](./docs/architecture.md) - System architecture and design decisions
- [Service Specification](./docs/service-specification.md) - API and service design
- [Document Categories](./docs/document-categories.md) - Governance document types
- [Contributing](./CONTRIBUTING.md) - How to contribute
- [Changelog](./CHANGELOG.md) - Release history

## License

This project is licensed under the [MIT License](./LICENSE).
