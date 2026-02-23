'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { useCreateDAO } from '../hooks/useCreateDAO';
import { createDAOSchema, type CreateDAOFormData, type DAOCreationProgress } from '../types';
import { DAOCreateProgressModal } from './DAOCreateProgressModal';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';
import { SIZE_OPTIONS } from '@/shared/constants/config';

const STEPS = ['基本情報', '追加情報', '確認'] as const;

export function DAOCreateForm() {
  const [step, setStep] = useState(0);
  const [createdUID, setCreatedUID] = useState<string | null>(null);
  const [progress, setProgress] = useState<DAOCreationProgress | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const createDAO = useCreateDAO();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CreateDAOFormData>({
    resolver: zodResolver(createDAOSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      memberCount: 1,
      size: 'small',
      logoUrl: '',
      website: '',
      contactPerson: '',
      contactEmail: '',
    },
  });

  const formValues = watch();

  const handleNext = async () => {
    if (step === 0) {
      const valid = await trigger(['name', 'description', 'location', 'memberCount', 'size']);
      if (!valid) return;
    }
    if (step === 1) {
      const valid = await trigger(['logoUrl', 'website', 'contactPerson', 'contactEmail']);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleProgress = useCallback((p: DAOCreationProgress) => {
    setProgress(p);
  }, []);

  const onSubmit = async (data: CreateDAOFormData) => {
    setModalOpen(true);
    setModalError(null);
    setProgress(null);

    try {
      const result = await createDAO.mutateAsync({
        formData: data,
        onProgress: handleProgress,
      });
      setCreatedUID(result.attestationUID);
      // Small delay so the user sees "完了" before the modal closes
      await new Promise((r) => setTimeout(r, 800));
      setModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'DAO の作成に失敗しました';
      setModalError(message);
      // Let the user see the error, then close modal after a delay
      await new Promise((r) => setTimeout(r, 2500));
      setModalOpen(false);
    }
  };

  const sizeLabel = SIZE_OPTIONS.find((o) => o.value === formValues.size)?.label ?? formValues.size;

  if (createdUID) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>DAO が作成されました</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            DAO がブロックチェーンに正常に登録されました。
          </p>
          <div className="rounded-xl bg-[var(--color-bg-primary)] p-3">
            <p className="text-xs text-[var(--color-text-secondary)]">Attestation UID</p>
            <p className="break-all font-mono text-sm text-skin-heading">{createdUID}</p>
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Link href={ROUTES.MY_DAO_DETAIL(createdUID)}>
            <Button>DAO を表示</Button>
          </Link>
          <Link href={ROUTES.MY_DAOS}>
            <Button variant="outline">マイ DAO 一覧</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <DAOCreateProgressModal open={modalOpen} progress={progress} error={modalError} />

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>新規 DAO 作成</CardTitle>
          {/* Progress indicator */}
          <div className="mt-4 flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={cn('h-px w-8', i <= step ? 'bg-primary-500' : 'bg-skin-border')}
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                      i < step
                        ? 'bg-primary-500 text-white'
                        : i === step
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      'hidden text-xs sm:inline',
                      i === step
                        ? 'font-medium text-skin-heading'
                        : 'text-[var(--color-text-secondary)]',
                    )}
                  >
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Step 1: Basic Info */}
            {step === 0 && (
              <>
                <Input
                  label="DAO 名"
                  placeholder="DAO の名称を入力"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-skin-heading">説明</label>
                  <textarea
                    className={cn(
                      'block w-full rounded-xl border px-3 py-2 text-sm transition-colors',
                      'bg-[var(--color-bg-secondary)] text-skin-heading placeholder:text-[var(--color-text-tertiary)]',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      errors.description
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-skin-border focus:ring-skin-primary',
                    )}
                    rows={3}
                    placeholder="DAO の説明を入力"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="mt-1.5 text-sm text-[var(--color-danger)]" role="alert">
                      {errors.description.message}
                    </p>
                  )}
                </div>
                <Input
                  label="所在地"
                  placeholder="例: 東京都"
                  error={errors.location?.message}
                  {...register('location')}
                />
                <Input
                  label="メンバー数"
                  type="number"
                  min={1}
                  error={errors.memberCount?.message}
                  {...register('memberCount', { valueAsNumber: true })}
                />
                <Select
                  label="規模"
                  options={SIZE_OPTIONS}
                  value={formValues.size}
                  onValueChange={(v) => setValue('size', v as 'small' | 'medium' | 'large')}
                  error={errors.size?.message}
                />
              </>
            )}

            {/* Step 2: Optional Info */}
            {step === 1 && (
              <>
                <Input
                  label="ロゴ URL"
                  placeholder="https://example.com/logo.png"
                  error={errors.logoUrl?.message}
                  {...register('logoUrl')}
                />
                <Input
                  label="Web サイト"
                  placeholder="https://example.com"
                  error={errors.website?.message}
                  {...register('website')}
                />
                <Input
                  label="担当者名"
                  placeholder="山田 太郎"
                  error={errors.contactPerson?.message}
                  {...register('contactPerson')}
                />
                <Input
                  label="連絡先メール"
                  type="email"
                  placeholder="contact@example.com"
                  error={errors.contactEmail?.message}
                  {...register('contactEmail')}
                />
              </>
            )}

            {/* Step 3: Review & Confirm */}
            {step === 2 && (
              <div className="space-y-3">
                <h4 className="font-medium text-skin-heading">入力内容の確認</h4>
                <div className="divide-y divide-[var(--color-border)] rounded-xl border border-skin-border">
                  <ReviewRow label="DAO 名" value={formValues.name} />
                  <ReviewRow label="説明" value={formValues.description} />
                  <ReviewRow label="所在地" value={formValues.location} />
                  <ReviewRow label="メンバー数" value={String(formValues.memberCount)} />
                  <ReviewRow label="規模" value={sizeLabel} />
                  {formValues.logoUrl && <ReviewRow label="ロゴ URL" value={formValues.logoUrl} />}
                  {formValues.website && (
                    <ReviewRow label="Web サイト" value={formValues.website} />
                  )}
                  {formValues.contactPerson && (
                    <ReviewRow label="担当者名" value={formValues.contactPerson} />
                  )}
                  {formValues.contactEmail && (
                    <ReviewRow label="連絡先メール" value={formValues.contactEmail} />
                  )}
                </div>
                <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    DAO の登録にはブロックチェーンへのトランザクションが必要です。Gas
                    費用が発生します。
                  </p>
                </div>
                {createDAO.isError && !modalOpen && (
                  <p className="text-sm text-[var(--color-danger)]" role="alert">
                    エラー:{' '}
                    {createDAO.error instanceof Error
                      ? createDAO.error.message
                      : 'DAO の作成に失敗しました'}
                  </p>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="gap-2">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={createDAO.isPending}
              >
                戻る
              </Button>
            )}
            {step < 2 && (
              <Button type="button" onClick={handleNext}>
                次へ
              </Button>
            )}
            {step === 2 && (
              <Button type="submit" disabled={createDAO.isPending}>
                DAO を作成
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2.5">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-skin-heading">{value}</span>
    </div>
  );
}
