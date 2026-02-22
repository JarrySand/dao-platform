'use client';

import Link from 'next/link';
import { ResetPasswordForm } from '@/features/auth';
import { ROUTES } from '@/shared/constants/routes';
import { Card, CardContent } from '@/shared/components/ui';

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 pt-6">
          <ResetPasswordForm />

          <div className="text-center text-sm">
            <Link
              href={ROUTES.LOGIN}
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              ログインページへ戻る
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
