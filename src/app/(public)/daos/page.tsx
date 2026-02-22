'use client';

import { Breadcrumb } from '@/shared/components/layout';
import { PageHeader } from '@/shared/components/layout';
import { DAOList } from '@/features/dao/components/DAOList';
import { ROUTES } from '@/shared/constants/routes';

const breadcrumbItems = [{ label: 'Home', href: ROUTES.HOME }, { label: 'DAO一覧' }];

export default function DAOListPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={breadcrumbItems} className="mb-4" />
      <PageHeader
        title="DAO一覧"
        description="登録されているDAOの一覧を確認できます"
        className="mb-8"
      />
      <DAOList />
    </div>
  );
}
