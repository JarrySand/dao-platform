'use client';

import Link from 'next/link';
import { Button } from '@/shared/components/ui';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui';
import { DAOStats } from '@/features/dao/components/DAOStats';
import { ROUTES } from '@/shared/constants/routes';

const features = [
  {
    title: '透明性',
    description:
      'すべてのDAOドキュメントはブロックチェーン上に記録され、誰でも検証可能な透明性を実現します。',
    icon: (
      <svg
        className="h-8 w-8"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    ),
  },
  {
    title: 'アテステーション',
    description:
      'Ethereum Attestation Service (EAS) を活用し、ドキュメントの真正性を暗号学的に証明します。',
    icon: (
      <svg
        className="h-8 w-8"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
      </svg>
    ),
  },
  {
    title: 'バージョン管理',
    description: 'ドキュメントの変更履歴を完全に追跡し、いつでも過去のバージョンを参照できます。',
    icon: (
      <svg
        className="h-8 w-8"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzEuNjU2IDAgMyAxLjM0NCAzIDN2MThjMCAxLjY1Ni0xLjM0NCAzLTMgM0gyMWMtMS42NTYgMC0zLTEuMzQ0LTMtM1YyMWMwLTEuNjU2IDEuMzQ0LTMgMy0zaDE1eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              DAO Document Platform
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-100 sm:text-xl">
              ブロックチェーン技術を活用した、透明で信頼性の高いDAOドキュメント管理プラットフォーム
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href={ROUTES.DAOS}>
                <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                  DAO一覧を見る
                </Button>
              </Link>
              <Link href={ROUTES.SIGNUP}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  アカウント作成
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            プラットフォーム統計
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            登録されているDAOとドキュメントの概要
          </p>
        </div>
        <div className="mx-auto max-w-lg">
          <DAOStats />
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 dark:bg-gray-800/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">主な機能</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              DAO運営に必要なドキュメント管理を強力にサポート
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                    {feature.icon}
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-primary-600 p-8 text-center dark:bg-primary-800 sm:p-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            DAOドキュメント管理を始めましょう
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-100">
            ブロックチェーンによる証明で、組織の透明性と信頼性を高めます。
          </p>
          <div className="mt-8">
            <Link href={ROUTES.DAOS}>
              <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                DAO一覧を見る
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
