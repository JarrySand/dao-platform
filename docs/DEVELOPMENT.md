# Development Guide

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+
- **MetaMask** browser extension
- **Sepolia testnet ETH** (from a faucet)
- **Firebase project** with Firestore enabled (Authentication is not required)
- **Pinata account** for IPFS storage

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/dao-doc-platform.git
cd dao-doc-platform/dao-platform
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable                                   | Description                               |
| ------------------------------------------ | ----------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase project API key                  |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain                      |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase project ID                       |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket                   |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID              |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase app ID                           |
| `PINATA_JWT`                               | Pinata JWT for IPFS uploads (server-only) |
| `NEXT_PUBLIC_DOCUMENT_V3_SCHEMA_UID`       | EAS Document v3 schema UID (Sepolia)      |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL`              | Sepolia RPC endpoint                      |

### 3. MetaMask setup

1. Install MetaMask browser extension
2. Add Sepolia testnet network
3. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script                  | Description                    |
| ----------------------- | ------------------------------ |
| `npm run dev`           | Start development server       |
| `npm run build`         | Production build               |
| `npm run lint`          | Run ESLint                     |
| `npm run typecheck`     | Run TypeScript type checking   |
| `npm run test`          | Run tests with Vitest          |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run format`        | Format code with Prettier      |

## Directory Structure

```
src/
  app/              # Next.js App Router pages
    (public)/       # Public pages (home, DAO list, DAO detail)
    (auth)/         # Authenticated pages (dashboard, my-dao)
    api/            # API routes
  features/         # Feature modules (Feature-Sliced Design)
    auth/           # Authentication feature
    wallet/         # Wallet connection feature
    dao/            # DAO management feature
    document/       # Document management feature
    dashboard/      # Dashboard feature
  shared/           # Shared code
    components/     # UI primitives, layout, feedback
    hooks/          # Shared React hooks
    lib/            # External service integrations
    providers/      # React providers
    types/          # Shared TypeScript types
    utils/          # Utility functions
    constants/      # App constants
  config/           # App configuration
  test/             # Test utilities and MSW handlers
```

## Architecture

This project follows **Feature-Sliced Design (FSD)**:

- `app/` - Pages and routing (Next.js App Router)
- `features/` - Self-contained feature modules with their own types, hooks, stores, components, and API clients
- `shared/` - Reusable code shared across features
- `config/` - Application configuration

### State Management

- **Zustand 5** - Client state (auth, wallet)
- **TanStack Query 5** - Server state (DAOs, documents, stats)

### Key Technologies

- Next.js 15 + React 19
- TypeScript strict mode
- Tailwind CSS 4 (dark mode support)
- Firebase Firestore (cache only)
- Ethereum Attestation Service (EAS)
- IPFS via Pinata
