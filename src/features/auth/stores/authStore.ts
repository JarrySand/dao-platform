/**
 * Wallet-based auth helpers.
 * The wallet store (walletStore) is the single source of truth for authentication.
 */

// Re-export the wallet store for backward compatibility
export { useWalletStore as useAuthStore } from '@/features/wallet/stores/walletStore';
