'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants/routes';
import { PlusCircleIcon, FolderIcon, SearchIcon } from '@/shared/components/icons';

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
              <h3 className="font-medium text-skin-heading">{action.title}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {action.description}
              </p>
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
