'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  registerDocumentSchema,
  isRegulationType,
  type RegisterDocumentFormData,
  type DocumentRegistrationProgress,
  type DocumentType,
} from '../types';
import { useRegisterDocument } from '../hooks/useRegisterDocument';
import { useExistingRegulation } from '../hooks/useExistingRegulation';
import { DocumentRegisterProgressModal } from './DocumentRegisterProgressModal';
import { FileUploader } from './FileUploader';
import { FileHashCalculator } from './FileHashCalculator';
import { cn } from '@/shared/utils/cn';
import { DOCUMENT_TYPES, type DocumentTypeKey } from '@/shared/constants/config';
import {
  Card,
  CardContent,
  CardFooter,
  Input,
  Button,
  Select,
  Alert,
} from '@/shared/components/ui';

interface DocumentRegisterFormProps {
  daoId: string;
  onSuccess?: () => void;
  previousVersionId?: string;
}

const DOCUMENT_TYPE_OPTIONS = [
  {
    label: '規程類',
    options: [
      { value: 'articles', label: '定款' },
      { value: 'assembly_rules', label: 'DAO総会規程' },
      { value: 'operation_rules', label: '運営規程' },
      { value: 'token_rules', label: 'トークン規程' },
      { value: 'custom_rules', label: 'カスタム規程' },
    ],
  },
  {
    label: 'その他ドキュメント',
    options: [
      { value: 'proposal', label: '投票議題' },
      { value: 'minutes', label: '議事録' },
    ],
  },
];

const STEPS = ['ファイル＆メタデータ', '投票情報', '確認'] as const;

const PROPOSAL_TYPE = 'proposal';

export function DocumentRegisterForm({
  daoId,
  onSuccess,
  previousVersionId,
}: DocumentRegisterFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [progress, setProgress] = useState<DocumentRegistrationProgress | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const registerMutation = useRegisterDocument();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<RegisterDocumentFormData>({
    resolver: zodResolver(registerDocumentSchema),
    defaultValues: {
      title: '',
      documentType: 'articles',
      previousVersionId: previousVersionId ?? null,
      votingTxHash: null,
      votingChainId: null,
    },
  });

  const documentType = watch('documentType');
  const title = watch('title');
  const isProposal = documentType === PROPOSAL_TYPE;
  const isRegulation = isRegulationType(documentType);

  // Auto-detect existing regulation for amendment flow (C1/C2/C3)
  const {
    latestActive,
    isAmendment,
    isLoading: isCheckingExisting,
  } = useExistingRegulation(
    daoId,
    documentType as DocumentType,
    documentType === 'custom_rules' ? title : undefined,
  );

  // Auto-set previousVersionId when existing regulation is detected
  useEffect(() => {
    if (!isRegulation) {
      // For proposal/minutes, always null (forced to 0x0 in useRegisterDocument)
      setValue('previousVersionId', null);
      return;
    }

    if (previousVersionId) {
      // Externally provided (e.g. from "create amendment" button)
      return;
    }

    if (latestActive) {
      setValue('previousVersionId', latestActive.id);
    } else {
      setValue('previousVersionId', null);
    }
  }, [isRegulation, latestActive, previousVersionId, setValue]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
  }, []);

  const handleHashCalculated = useCallback((hash: string) => {
    setFileHash(hash);
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleNext = async () => {
    if (step === 0) {
      const valid = await trigger(['title', 'documentType']);
      if (!valid || !file) return;

      if (isProposal) {
        setStep(1);
      } else {
        setStep(2);
      }
    } else if (step === 1) {
      setStep(2);
    }
    scrollToForm();
  };

  const handleBack = () => {
    if (step === 2 && !isProposal) {
      setStep(0);
    } else {
      setStep((s) => Math.max(0, s - 1));
    }
    scrollToForm();
  };

  const onSubmit = (data: RegisterDocumentFormData) => {
    if (!file) return;

    registerMutation.mutate(
      {
        formData: data,
        file,
        daoId,
        onProgress: setProgress,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
        onError: () => {
          setShowErrorModal(true);
        },
      },
    );
  };

  const formValues = watch();

  // Version display for regulation types
  const nextVersion = latestActive ? latestActive.version + 1 : 1;

  return (
    <div ref={formRef} className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((label, i) => {
          const isActive = i === step;
          const isComplete = i < step;
          // Skip step 1 if not voting
          if (i === 1 && !isProposal) return null;

          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && !(i === 1 && !isProposal) && (
                <div
                  className={cn('h-0.5 w-8', isComplete ? 'bg-skin-primary' : 'bg-skin-border')}
                />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                    isActive && 'bg-skin-primary text-white',
                    isComplete &&
                      'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
                    !isActive &&
                      !isComplete &&
                      'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]',
                  )}
                >
                  {isComplete ? (
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="hidden text-xs text-[var(--color-text-secondary)] sm:inline">
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress modal during registration */}
      <DocumentRegisterProgressModal
        open={registerMutation.isPending || showErrorModal}
        progress={progress}
        error={
          registerMutation.isError
            ? registerMutation.error instanceof Error
              ? registerMutation.error.message
              : '不明なエラー'
            : null
        }
        onClose={() => setShowErrorModal(false)}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: File + Metadata */}
        {step === 0 && (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <FileUploader onFileSelect={handleFileSelect} accept="application/pdf,.pdf" />
              <FileHashCalculator file={file} onHashCalculated={handleHashCalculated} />

              <Input label="タイトル" error={errors.title?.message} {...register('title')} />

              <Controller
                control={control}
                name="documentType"
                render={({ field }) => (
                  <Select
                    label="ドキュメント種別"
                    options={DOCUMENT_TYPE_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={errors.documentType?.message}
                  />
                )}
              />

              {/* Amendment detection indicator (C1/C2) */}
              {isRegulation && !isCheckingExisting && (
                <>
                  {isAmendment && latestActive ? (
                    <Alert variant="info">
                      既存の有効版（v{latestActive.version}）が検出されました。改定版（v
                      {nextVersion}）として登録されます。
                    </Alert>
                  ) : (
                    <Alert variant="info">新規登録（v1）として登録されます。</Alert>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="button" onClick={handleNext} disabled={!file || isCheckingExisting}>
                次へ
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Voting fields (only for proposal type) */}
        {step === 1 && isProposal && (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Alert variant="info">
                投票議題の場合、関連する投票トランザクション情報を入力してください。
              </Alert>

              <Input
                label="投票トランザクションハッシュ"
                placeholder="0x..."
                error={errors.votingTxHash?.message}
                {...register('votingTxHash')}
              />

              <Input
                label="チェーンID"
                type="number"
                placeholder="例: 11155111"
                error={errors.votingChainId?.message}
                {...register('votingChainId', { valueAsNumber: true })}
              />
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                戻る
              </Button>
              <Button type="button" onClick={handleNext}>
                次へ
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Review + Confirm */}
        {step === 2 && (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h3 className="text-lg font-semibold text-skin-heading">登録内容の確認</h3>

              <div className="space-y-2 rounded-xl bg-[var(--color-bg-hover)] p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">タイトル</span>
                  <span className="font-medium text-skin-heading">{formValues.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">種別</span>
                  <span className="font-medium text-skin-heading">
                    {DOCUMENT_TYPES[formValues.documentType as DocumentTypeKey] ??
                      formValues.documentType}
                  </span>
                </div>
                {isRegulation && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">登録種類</span>
                    <span className="font-medium text-skin-heading">
                      {isAmendment ? `改定（v${nextVersion}）` : '新規登録（v1）'}
                    </span>
                  </div>
                )}
                {file && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">ファイル</span>
                    <span className="font-medium text-skin-heading">{file.name}</span>
                  </div>
                )}
                {fileHash && (
                  <div>
                    <span className="text-[var(--color-text-secondary)]">SHA-256</span>
                    <p className="mt-1 break-all text-xs font-mono text-skin-heading">{fileHash}</p>
                  </div>
                )}
                {isProposal && formValues.votingTxHash && (
                  <div>
                    <span className="text-[var(--color-text-secondary)]">投票TX</span>
                    <p className="mt-1 break-all text-xs font-mono text-skin-heading">
                      {formValues.votingTxHash}
                    </p>
                  </div>
                )}
              </div>

              {registerMutation.isError && (
                <Alert variant="error">
                  登録に失敗しました:{' '}
                  {registerMutation.error instanceof Error
                    ? registerMutation.error.message
                    : '不明なエラー'}
                </Alert>
              )}

              {registerMutation.isSuccess && (
                <Alert variant="success">ドキュメントの登録が完了しました。</Alert>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={registerMutation.isPending}
              >
                戻る
              </Button>
              <Button
                type="submit"
                isLoading={registerMutation.isPending}
                disabled={registerMutation.isPending || registerMutation.isSuccess}
              >
                登録する
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  );
}
