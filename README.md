# DAO Document Platform

A decentralized platform for managing DAO governance documents with blockchain-verified authenticity and immutability. Built on Ethereum Attestation Service (EAS) for trustless document verification.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand + TanStack Query
- **Blockchain**: Ethereum (Sepolia), EAS SDK, ethers.js v6
- **Storage**: IPFS (Pinata), Firebase Firestore
- **Auth**: Firebase Authentication
- **Testing**: Vitest, Testing Library, MSW

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
- View DAO governance documents (articles of association, bylaws)
- Verify document authenticity against on-chain attestations
- View full document version history

### DAO Administrators

- Register and manage DAO profiles
- Upload and version governance documents
- Create blockchain attestations (EAS) for document integrity
- Store documents on IPFS for decentralized availability

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

## Available Scripts

| Command              | Description                      |
|----------------------|----------------------------------|
| `npm run dev`        | Start development server         |
| `npm run build`      | Create production build          |
| `npm run start`      | Start production server          |
| `npm run lint`       | Run ESLint                       |
| `npm run typecheck`  | Run TypeScript type checking     |
| `npm run test`       | Run tests                        |
| `npm run test:watch` | Run tests in watch mode          |
| `npm run format`     | Format code with Prettier        |

## Documentation

- [Development Guide](./docs/DEVELOPMENT.md) - Detailed setup and development instructions
- [Architecture](./docs/architecture.md) - System architecture and design decisions
- [Contributing](./CONTRIBUTING.md) - How to contribute
- [Changelog](./CHANGELOG.md) - Release history

## License

This project is licensed under the [MIT License](./LICENSE).
