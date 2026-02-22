'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  registerDocumentSchema,
  type RegisterDocumentFormData,
  type DocumentRegistrationProgress,
} from '../types';
import { useRegisterDocument } from '../hooks/useRegisterDocument';
import { FileUploader } from './FileUploader';
import { FileHashCalculator } from './FileHashCalculator';
import { cn } from '@/shared/utils/cn';
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
  { value: 'articles', label: '定款' },
  { value: 'meeting', label: '議事録' },
  { value: 'token', label: 'トークン' },
  { value: 'operation', label: '運営' },
  { value: 'voting', label: '投票' },
  { value: 'other', label: 'その他' },
];

const STEPS = ['ファイル＆メタデータ', '投票情報', '確認'] as const;

export function DocumentRegisterForm({
  daoId,
  onSuccess,
  previousVersionId,
}: DocumentRegisterFormProps) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [progress, setProgress] = useState<DocumentRegistrationProgress | null>(null);

  const registerMutation = useRegisterDocument();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    trigger,
  } = useForm<RegisterDocumentFormData>({
    resolver: zodResolver(registerDocumentSchema),
    defaultValues: {
      title: '',
      documentType: 'articles',
      version: '1.0',
      previousVersionId: previousVersionId ?? null,
      votingTxHash: null,
      votingChainId: null,
    },
  });

  const documentType = watch('documentType');
  const isVoting = documentType === 'voting';

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
  }, []);

  const handleHashCalculated = useCallback((hash: string) => {
    setFileHash(hash);
  }, []);

  const handleNext = async () => {
    if (step === 0) {
      const valid = await trigger(['title', 'documentType', 'version']);
      if (!valid || !file) return;

      if (isVoting) {
        setStep(1);
      } else {
        setStep(2);
      }
    } else if (step === 1) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2 && !isVoting) {
      setStep(0);
    } else {
      setStep((s) => Math.max(0, s - 1));
    }
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
      },
    );
  };

  const formValues = watch();

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((label, i) => {
          const isActive = i === step;
          const isComplete = i < step;
          // Skip step 1 if not voting
          if (i === 1 && !isVoting) return null;

          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && !(i === 1 && !isVoting) && (
                <div
                  className={cn(
                    'h-0.5 w-8',
                    isComplete
                      ? 'bg-primary-600 dark:bg-primary-400'
                      : 'bg-gray-300 dark:bg-gray-600',
                  )}
                />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                    isActive && 'bg-primary-600 text-white dark:bg-primary-500',
                    isComplete &&
                      'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
                    !isActive &&
                      !isComplete &&
                      'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
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
                <span className="hidden text-xs text-gray-600 dark:text-gray-400 sm:inline">
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar during registration */}
      {progress && (
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-primary-600 transition-all duration-500 dark:bg-primary-500"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">{progress.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: File + Metadata */}
        {step === 0 && (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <FileUploader onFileSelect={handleFileSelect} />
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

              <Input
                label="バージョン"
                placeholder="例: 1.0.0"
                error={errors.version?.message}
                {...register('version')}
              />
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="button" onClick={handleNext} disabled={!file}>
                次へ
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Voting fields (only for voting type) */}
        {step === 1 && isVoting && (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Alert variant="info">
                投票ドキュメントの場合、関連する投票トランザクション情報を入力してください。
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                登録内容の確認
              </h3>

              <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">タイトル</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formValues.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">種別</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {DOCUMENT_TYPE_OPTIONS.find((o) => o.value === formValues.documentType)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">バージョン</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formValues.version}
                  </span>
                </div>
                {file && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">ファイル</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {file.name}
                    </span>
                  </div>
                )}
                {fileHash && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">SHA-256</span>
                    <p className="mt-1 break-all text-xs font-mono text-gray-700 dark:text-gray-300">
                      {fileHash}
                    </p>
                  </div>
                )}
                {isVoting && formValues.votingTxHash && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">投票TX</span>
                    <p className="mt-1 break-all text-xs font-mono text-gray-700 dark:text-gray-300">
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
