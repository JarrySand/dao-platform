'use client';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/shared/components/ui/Modal';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { cn } from '@/shared/utils/cn';
import type { DAOCreationProgress } from '../types';

interface DAOCreateProgressModalProps {
  open: boolean;
  progress: DAOCreationProgress | null;
  error?: string | null;
}

const STEPS = [
  { key: 'signing', label: 'ウォレット署名' },
  { key: 'confirming', label: 'トランザクション確認' },
  { key: 'saving', label: 'データ保存' },
  { key: 'complete', label: '完了' },
] as const;

function getStepIndex(step: DAOCreationProgress['step']): number {
  return STEPS.findIndex((s) => s.key === step);
}

export function DAOCreateProgressModal({ open, progress, error }: DAOCreateProgressModalProps) {
  const currentStepIndex = progress ? getStepIndex(progress.step) : -1;

  return (
    <Modal open={open}>
      <ModalContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <ModalHeader>
          <ModalTitle>{error ? 'エラーが発生しました' : 'DAO を作成中'}</ModalTitle>
          <ModalDescription>
            {error
              ? 'DAO の作成中にエラーが発生しました。'
              : 'ブロックチェーンにトランザクションを送信しています。ウォレットの画面を確認してください。'}
          </ModalDescription>
        </ModalHeader>

        {/* Progress bar */}
        {!error && progress && (
          <div className="mb-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-hover)]">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Step list */}
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isActive = i === currentStepIndex && !error;
            const isCompleted = i < currentStepIndex || progress?.step === 'complete';
            const isPending = i > currentStepIndex;

            return (
              <div key={step.key} className="flex items-center gap-3">
                {/* Step indicator */}
                <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                  {isActive ? (
                    <LoadingSpinner size="sm" />
                  ) : isCompleted ? (
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        isPending
                          ? 'bg-[var(--color-bg-hover)]'
                          : 'bg-[var(--color-text-secondary)]',
                      )}
                    />
                  )}
                </div>

                {/* Step label */}
                <span
                  className={cn(
                    'text-sm',
                    isActive && 'font-medium text-skin-heading',
                    isCompleted && 'text-green-600 dark:text-green-400',
                    isPending && 'text-[var(--color-text-tertiary)]',
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current status message */}
        {!error && progress && progress.step !== 'complete' && (
          <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">
            {progress.message}
          </p>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
