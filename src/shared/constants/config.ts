export const APP_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['application/pdf'],
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  API_TIMEOUT: 30_000, // 30s
  TOAST_DURATION: 5_000, // 5s
  DEBOUNCE_DELAY: 300, // 300ms
  VERSION_CHAIN_MAX_DEPTH: 20,
} as const;

export const DOCUMENT_TYPES = {
  articles: '定款',
  assembly_rules: 'DAO総会規程',
  operation_rules: '運営規程',
  token_rules: 'トークン規程',
  custom_rules: 'カスタム規程',
  proposal: '投票議題',
  minutes: '議事録',
} as const;

export type DocumentTypeKey = keyof typeof DOCUMENT_TYPES;

export const SIZE_OPTIONS = [
  { label: '小規模 (1-50人)', value: 'small' },
  { label: '中規模 (51-200人)', value: 'medium' },
  { label: '大規模 (201人以上)', value: 'large' },
] as const;
