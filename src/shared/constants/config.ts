export const APP_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ],
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  API_TIMEOUT: 30_000, // 30s
  TOAST_DURATION: 5_000, // 5s
  DEBOUNCE_DELAY: 300, // 300ms
  VERSION_CHAIN_MAX_DEPTH: 20,
} as const;

export const DOCUMENT_TYPES = {
  articles: '定款',
  meeting: 'DAO総会規程',
  token: 'トークン規程',
  operation: '運営規程',
  voting: '投票ドキュメント',
  other: 'その他',
} as const;

export type DocumentTypeKey = keyof typeof DOCUMENT_TYPES;
