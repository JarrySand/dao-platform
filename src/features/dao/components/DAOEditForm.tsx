'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from '@/shared/components/ui/Modal';
import { useUpdateDAO } from '../hooks/useUpdateDAO';
import { updateDAOSchema, type DAO, type UpdateDAOFormData } from '../types';
import { cn } from '@/shared/utils/cn';
import { SIZE_OPTIONS } from '@/shared/constants/config';

interface DAOEditFormProps {
  dao: DAO;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DAOEditForm({ dao, onSuccess, onCancel }: DAOEditFormProps) {
  const updateDAO = useUpdateDAO();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateDAOFormData>({
    resolver: zodResolver(updateDAOSchema),
    defaultValues: {
      description: dao.description,
      location: dao.location,
      memberCount: dao.memberCount,
      size: dao.size as 'small' | 'medium' | 'large',
      logoUrl: dao.logoUrl || '',
      website: dao.website || '',
      contactPerson: dao.contactPerson || '',
      contactEmail: dao.contactEmail || '',
    },
  });

  const sizeValue = watch('size');

  const onSubmit = async (data: UpdateDAOFormData) => {
    const result = await updateDAO.mutateAsync({ id: dao.id, data });
    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onCancel?.();
      }}
    >
      <ModalContent className="max-h-[85vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>DAO 情報を編集</ModalTitle>
          <ModalDescription>{dao.name} の情報を更新します</ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1.5 text-sm text-[var(--color-danger)]" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          <Input label="所在地" error={errors.location?.message} {...register('location')} />

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
            value={sizeValue}
            onValueChange={(v) => setValue('size', v as 'small' | 'medium' | 'large')}
            error={errors.size?.message}
          />

          <Input label="ロゴ URL" error={errors.logoUrl?.message} {...register('logoUrl')} />

          <Input label="Web サイト" error={errors.website?.message} {...register('website')} />

          <Input
            label="担当者名"
            error={errors.contactPerson?.message}
            {...register('contactPerson')}
          />

          <Input
            label="連絡先メール"
            type="email"
            error={errors.contactEmail?.message}
            {...register('contactEmail')}
          />

          {updateDAO.isError && (
            <p className="text-sm text-[var(--color-danger)]" role="alert">
              エラー:{' '}
              {updateDAO.error instanceof Error ? updateDAO.error.message : '更新に失敗しました'}
            </p>
          )}

          <ModalFooter>
            <ModalClose asChild>
              <Button type="button" variant="outline" disabled={updateDAO.isPending}>
                キャンセル
              </Button>
            </ModalClose>
            <Button type="submit" isLoading={updateDAO.isPending}>
              保存
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
