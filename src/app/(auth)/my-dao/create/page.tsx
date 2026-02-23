'use client';

import { DAOCreateForm } from '@/features/dao/components/DAOCreateForm';
import { Breadcrumb } from '@/shared/components/layout/Breadcrumb';
import { ROUTES } from '@/shared/constants/routes';

export default function CreateDAOPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: ROUTES.HOME },
          { label: 'マイ DAO', href: ROUTES.MY_DAOS },
          { label: '新規作成' },
        ]}
        className="mb-6"
      />
      <DAOCreateForm />
    </div>
  );
}
