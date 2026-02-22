'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants/routes';

const ACTIONS = [
  {
    title: 'DAO を作成',
    description: '新しい DAO を登録してブロックチェーンに記録します',
    href: ROUTES.MY_DAO_CREATE,
    Icon: PlusCircleIcon,
  },
  {
    title: 'マイ DAO',
    description: '管理している DAO の一覧を確認します',
    href: ROUTES.MY_DAOS,
    Icon: FolderIcon,
  },
  {
    title: 'DAO 一覧',
    description: '登録済みの DAO を検索・閲覧します',
    href: ROUTES.DAOS,
    Icon: SearchIcon,
  },
] as const;

export function QuickActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ACTIONS.map((action) => (
        <Card key={action.href}>
          <CardContent className="flex flex-col items-start gap-3 p-5">
            <action.Icon className="h-8 w-8 text-primary-500 dark:text-primary-400" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">{action.title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
            </div>
            <Link href={action.href} className="mt-auto">
              <Button variant="outline" size="sm">
                開く
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}
