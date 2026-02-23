'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDAO, useDeactivateDAO, type DAO } from '@/features/dao';
import { DAOEditForm } from '@/features/dao/components/DAOEditForm';
import { DocumentList } from '@/features/document/components/DocumentList';
import { DocumentRegisterForm } from '@/features/document/components/DocumentRegisterForm';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/Tabs';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from '@/shared/components/ui/Modal';
import { Breadcrumb } from '@/shared/components/layout/Breadcrumb';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { ErrorDisplay } from '@/shared/components/feedback/ErrorDisplay';
import { ROUTES } from '@/shared/constants/routes';
import { shortenAddress, formatDate } from '@/shared/utils/format';

interface Props {
  params: Promise<{ id: string }>;
}

export default function MyDAODetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, error, refetch } = useDAO(id);
  const deactivateDAO = useDeactivateDAO();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner center size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorDisplay message="DAO の取得に失敗しました" onRetry={() => refetch()} />
      </div>
    );
  }

  const dao: DAO = data;

  const handleDeactivate = async () => {
    await deactivateDAO.mutateAsync(dao.id);
    setIsDeactivateOpen(false);
    router.push(ROUTES.MY_DAOS);
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    refetch();
  };

  const sizeLabel =
    dao.size === 'small'
      ? '小規模'
      : dao.size === 'medium'
        ? '中規模'
        : dao.size === 'large'
          ? '大規模'
          : dao.size;

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: ROUTES.HOME },
          { label: 'マイ DAO', href: ROUTES.MY_DAOS },
          { label: dao.name },
        ]}
        className="mb-6"
      />

      {/* DAO Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-skin-heading">{dao.name}</h1>
            <Badge variant={dao.status === 'active' ? 'success' : 'error'}>
              {dao.status === 'active' ? '有効' : '無効'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{dao.location}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            編集
          </Button>
          <Button variant="danger" onClick={() => setIsDeactivateOpen(true)}>
            無効化
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">基本情報</TabsTrigger>
          <TabsTrigger value="documents">ドキュメント管理</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="info">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>DAO 詳細</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <InfoItem label="DAO 名" value={dao.name} />
                <InfoItem label="所在地" value={dao.location} />
                <InfoItem label="規模" value={sizeLabel} />
                <InfoItem label="メンバー数" value={`${dao.memberCount}人`} />
                <InfoItem label="管理者アドレス" value={shortenAddress(dao.adminAddress)} />
                <InfoItem
                  label="ステータス"
                  value={dao.status === 'active' ? '運営中' : '停止中'}
                />
                <InfoItem label="Web サイト" value={dao.website || '未設定'} />
                <InfoItem label="担当者名" value={dao.contactPerson || '未設定'} />
                <InfoItem label="連絡先メール" value={dao.contactEmail || '未設定'} />
                <InfoItem label="信頼スコア" value={String(dao.trustScore)} />
                <InfoItem label="作成日" value={formatDate(dao.createdAt)} />
                <div className="sm:col-span-2">
                  <InfoItem label="説明" value={dao.description} />
                </div>
                <div className="sm:col-span-2">
                  <InfoItem label="Attestation UID" value={dao.attestationUID} mono />
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <div className="mt-4 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-skin-heading">ドキュメント一覧</h3>
              <Button onClick={() => setIsRegisterOpen(!isRegisterOpen)}>
                {isRegisterOpen ? 'キャンセル' : 'ドキュメント登録'}
              </Button>
            </div>

            {isRegisterOpen && (
              <DocumentRegisterForm daoId={dao.id} onSuccess={() => setIsRegisterOpen(false)} />
            )}

            <DocumentList daoId={dao.id} isAdmin />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      {isEditing && (
        <DAOEditForm dao={dao} onSuccess={handleEditSuccess} onCancel={() => setIsEditing(false)} />
      )}

      {/* Deactivate Confirmation Modal */}
      <Modal open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>DAO の無効化</ModalTitle>
            <ModalDescription>
              {dao.name} を無効化しますか？この操作により DAO は非アクティブ状態になります。
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline" disabled={deactivateDAO.isPending}>
                キャンセル
              </Button>
            </ModalClose>
            <Button variant="danger" isLoading={deactivateDAO.isPending} onClick={handleDeactivate}>
              無効化する
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-sm text-[var(--color-text-secondary)]">{label}</dt>
      <dd className={`mt-1 text-sm text-skin-heading ${mono ? 'break-all font-mono' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
