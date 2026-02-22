'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { useCreateDAO } from '../hooks/useCreateDAO';
import { createDAOSchema, type CreateDAOFormData } from '../types';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';

const SIZE_OPTIONS = [
  { label: '小規模 (1-50人)', value: 'small' },
  { label: '中規模 (51-200人)', value: 'medium' },
  { label: '大規模 (201人以上)', value: 'large' },
];

const STEPS = ['基本情報', '追加情報', '確認'] as const;

export function DAOCreateForm() {
  const [step, setStep] = useState(0);
  const [createdUID, setCreatedUID] = useState<string | null>(null);
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

  const onSubmit = async (data: CreateDAOFormData) => {
    const result = await createDAO.mutateAsync(data);
    if (result.success) {
      setCreatedUID(result.data.id);
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
          <p className="text-sm text-gray-600 dark:text-gray-400">DAO が正常に登録されました。</p>
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">Attestation UID</p>
            <p className="break-all font-mono text-sm text-gray-900 dark:text-gray-100">
              {createdUID}
            </p>
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
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>新規 DAO 作成</CardTitle>
        {/* Progress indicator */}
        <div className="mt-4 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={cn(
                    'h-px w-8',
                    i <= step ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600',
                  )}
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
                        : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    'hidden text-xs sm:inline',
                    i === step
                      ? 'font-medium text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400',
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
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  説明
                </label>
                <textarea
                  className={cn(
                    'block w-full rounded-lg border px-3 py-2 text-sm transition-colors',
                    'bg-white text-gray-900 placeholder:text-gray-400',
                    'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    errors.description
                      ? 'border-red-500 focus:ring-red-500 dark:border-red-400'
                      : 'border-gray-300 focus:ring-primary-500 dark:border-gray-600',
                  )}
                  rows={3}
                  placeholder="DAO の説明を入力"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
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
              <h4 className="font-medium text-gray-900 dark:text-gray-100">入力内容の確認</h4>
              <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                <ReviewRow label="DAO 名" value={formValues.name} />
                <ReviewRow label="説明" value={formValues.description} />
                <ReviewRow label="所在地" value={formValues.location} />
                <ReviewRow label="メンバー数" value={String(formValues.memberCount)} />
                <ReviewRow label="規模" value={sizeLabel} />
                {formValues.logoUrl && <ReviewRow label="ロゴ URL" value={formValues.logoUrl} />}
                {formValues.website && <ReviewRow label="Web サイト" value={formValues.website} />}
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
              {createDAO.isError && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
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
            <Button type="submit" isLoading={createDAO.isPending}>
              DAO を作成
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2.5">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}
