# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0-alpha] - 2026-02-22

### Added

- **Feature-Sliced Design architecture** - Complete re-architecture from monolithic to FSD pattern (`app/` -> `features/` -> `shared/` -> `config/`)
- **Zustand 5 state management** - Replaced React Context API with Zustand stores for auth, wallet state
- **TanStack Query 5** - Server state management with caching, pagination, and optimistic updates
- **React Hook Form 7 + Zod 3** - Type-safe form validation for DAO creation, document registration
- **Dark mode** - Full dark mode support with CSS variable theming and class-based toggling
- **Responsive design** - Mobile-first responsive layouts (320px - 1920px)
- **EAS Document v2 schema** - Extended schema with version control, voting document support
- **Document version management** - Version chain tracking with `previousVersionId`
- **Voting document support** - TX hash and chain ID fields for governance documents
- **Dashboard** - Stats cards, recent activity, quick actions
- **API rate limiting** - In-memory rate limiter for EAS proxy
- **CI/CD pipeline** - GitHub Actions for lint, typecheck, test, build
- **OSS documentation** - README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, DEVELOPMENT guide
- **Vitest + RTL + MSW** - Test infrastructure with mock handlers

### Changed

- **Next.js 15 + React 19** - Upgraded from Next.js 14, async params pattern
- **Tailwind CSS 4** - Upgraded with CSS variable-based theming
- **API routes** - All routes rewritten with Zod validation, proper error handling
- **Firebase integration** - Modular imports, tree-shakeable SDK usage
- **IPFS storage** - Switched from nft.storage to Pinata

### Removed

- **v1 monolithic code** - Removed `src/components/`, `src/contexts/`, `src/services/`, `src/utils/`, `src/types/`
- **nft.storage dependency** - Replaced with Pinata
- **React Context API** - Replaced with Zustand stores
- **Legacy config files** - Removed `next.config.js`, `tailwind.config.js`, `postcss.config.js`
