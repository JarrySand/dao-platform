'use client';

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/shared/utils/cn';
import { formatFileSize } from '@/shared/utils/format';
import { Button } from '@/shared/components/ui';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUploader({
  onFileSelect,
  accept,
  maxSize = DEFAULT_MAX_SIZE,
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      setError(null);

      if (file.size > maxSize) {
        setError(`ファイルサイズが上限（${formatFileSize(maxSize)}）を超えています`);
        return false;
      }

      if (accept) {
        const acceptedTypes = accept.split(',').map((t) => t.trim());
        const fileType = file.type;
        const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;

        const isValid = acceptedTypes.some((type) => {
          if (type.startsWith('.')) return fileExt === type.toLowerCase();
          if (type.endsWith('/*')) return fileType.startsWith(type.replace('/*', '/'));
          return fileType === type;
        });

        if (!isValid) {
          setError('サポートされていないファイル形式です');
          return false;
        }
      }

      return true;
    },
    [accept, maxSize],
  );

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [validateFile, onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
          'border-skin-border bg-[var(--color-bg-hover)] hover:border-primary-400 hover:bg-[var(--color-bg-hover)]',
          dragOver &&
            'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-950',
        )}
      >
        <svg
          className="mb-3 h-10 w-10 text-[var(--color-text-tertiary)]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
          />
        </svg>
        <p className="text-sm text-[var(--color-text-secondary)]">
          ファイルをドラッグ＆ドロップ、またはクリックして選択
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          最大 {formatFileSize(maxSize)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}

      {selectedFile && (
        <div className="flex items-center justify-between rounded-xl border border-skin-border bg-[var(--color-bg-secondary)] p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-skin-heading">{selectedFile.name}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            削除
          </Button>
        </div>
      )}
    </div>
  );
}
