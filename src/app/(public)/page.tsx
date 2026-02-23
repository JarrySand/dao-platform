'use client';

import Link from 'next/link';
import { Button } from '@/shared/components/ui';
import { DAOStats } from '@/features/dao/components/DAOStats';
import { ROUTES } from '@/shared/constants/routes';

const purposes = [
  'オンチェーン議決からオフチェーン文書まで、改ざんできない信頼チェーンを繋ぐ',
  'アカウント不要で、誰でもどのDAOの文書も検証できる',
  'すべての合同会社型DAOが使える、エコシステム共通の公共インフラ',
];

const steps = [
  {
    step: '1',
    title: 'DAOを登録する',
    description:
      'ウォレットを接続し、DAOの基本情報をブロックチェーンに記録。プラットフォーム上に公開される。',
  },
  {
    step: '2',
    title: 'ドキュメントを登録する',
    description:
      '定款・議事録などをアップロード。ファイルのハッシュと所在情報がオンチェーンに刻まれ、改ざん不可能な証明になる。',
  },
  {
    step: '3',
    title: '誰でも検証できる',
    description:
      'アカウント不要。ブラウザだけで文書をダウンロードし、原本との一致をその場で確認できる。',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Header */}
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-skin-heading">DAO Document Platform</h1>
        <p className="mt-2 max-w-xl text-[var(--color-text-secondary)]">
          ブロックチェーン技術を活用した、透明で信頼性の高いDAOドキュメント管理プラットフォーム
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link href={ROUTES.DAOS}>
            <Button>DAO一覧を見る</Button>
          </Link>
          <Link href={ROUTES.MY_DAO_CREATE}>
            <Button variant="outline">DAOを登録する</Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-skin-border">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <DAOStats />
        </div>
      </section>

      {/* Purpose */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-skin-heading">
          このプラットフォームが解決すること
        </h2>
        <ul className="mt-4 space-y-2">
          {purposes.map((p) => (
            <li
              key={p}
              className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              {p}
            </li>
          ))}
        </ul>
      </section>

      {/* Steps */}
      <section className="border-t border-skin-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-skin-heading">使い方</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-skin-border text-xs font-semibold text-skin-heading">
                  {s.step}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-skin-heading">{s.title}</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
