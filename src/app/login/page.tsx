'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/features/auth';
import { ROUTES } from '@/shared/constants/routes';
import { Card, CardContent } from '@/shared/components/ui';

function LoginContent() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 pt-6">
          <LoginForm />

          <div className="space-y-2 text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              アカウントをお持ちでない方は{' '}
              <Link
                href={ROUTES.SIGNUP}
                className="font-medium text-primary-600 hover:underline dark:text-primary-400"
              >
                新規登録
              </Link>
            </p>
            <p>
              <Link
                href={ROUTES.RESET_PASSWORD}
                className="text-sm text-primary-600 hover:underline dark:text-primary-400"
              >
                パスワードをお忘れの方
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
