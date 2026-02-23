'use client';

import { use } from 'react';
import Link from 'next/link';
import { Breadcrumb } from '@/shared/components/layout';
import { PageHeader } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui';
import { DAODetail } from '@/features/dao/components/DAODetail';
import { useDAO } from '@/features/dao/hooks/useDAO';
import { ROUTES } from '@/shared/constants/routes';

function DAODetailPageContent({ id }: { id: string }) {
  const { data } = useDAO(id);
  const daoName = data?.name ?? 'DAO詳細';

  const breadcrumbItems = [
    { label: 'Home', href: ROUTES.HOME },
    { label: 'DAO一覧', href: ROUTES.DAOS },
    { label: daoName },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={breadcrumbItems} className="mb-4" />
      <div className="mb-8 flex items-center gap-4">
        <Link href={ROUTES.DAOS}>
          <Button variant="ghost" size="sm">
            <svg
              className="mr-1 h-4 w-4"
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
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            戻る
          </Button>
        </Link>
        <PageHeader title={daoName} className="flex-1" />
      </div>
      <DAODetail daoId={id} />
    </div>
  );
}

export default function DAODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <DAODetailPageContent id={id} />;
}
