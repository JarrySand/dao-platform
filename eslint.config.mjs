import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  // Base rules for all files
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // v2 architecture enforcement: only for new v2 code
  {
    files: ['src/shared/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}', 'src/config/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/components/*'],
              message: 'Use @/shared/components/ or @/features/*/components/ instead',
            },
            {
              group: ['@/contexts/*'],
              message: 'Use @/features/*/stores/ instead',
            },
            {
              group: ['@/services/*'],
              message: 'Use @/shared/lib/ or @/features/*/utils/ instead',
            },
            {
              group: ['@/utils/*'],
              message: 'Use @/shared/utils/ or @/shared/lib/ instead',
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
