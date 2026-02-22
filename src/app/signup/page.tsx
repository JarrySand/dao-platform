'use client';

import Link from 'next/link';
import { SignupForm } from '@/features/auth';
import { ROUTES } from '@/shared/constants/routes';
import { Card, CardContent } from '@/shared/components/ui';

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 pt-6">
          <SignupForm />

          <div className="text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              既にアカウントをお持ちの方は{' '}
              <Link
                href={ROUTES.LOGIN}
                className="font-medium text-primary-600 hover:underline dark:text-primary-400"
              >
                ログイン
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
