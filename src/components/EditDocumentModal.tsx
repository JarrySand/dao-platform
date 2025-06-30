'use client';

import { useState } from 'react';
import { Document, DocumentType } from '@/types';
import Modal from './Modal';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document?: Document;
  daoId: string;
  onSave: (document: Document) => void;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  'articles': '定款',
  'meeting': 'DAO総会規程',
  'token': 'トークン規程',
  'operation': '運営規程',
  'other': 'その他'
};

export default function EditDocumentModal({
  isOpen,
  onClose,
  document,
  daoId,
  onSave,
}: EditDocumentModalProps) {
  const [formData, setFormData] = useState({
    name: document?.name ?? '',
    type: document?.type ?? 'articles',
    fileUrl: document?.fileUrl ?? '',
    version: document?.version ?? 1,
  });
  const [error, setError] = useState('');

  const validateFileUrl = (url: string): boolean => {
    // GitHubのURLであることを確認
    if (!url.startsWith('https://github.com/')) {
      setError('GitHubのURLを入力してください');
      return false;
    }

    // PDFファイルであることを確認
    if (!url.toLowerCase().endsWith('.pdf')) {
      setError('PDFファイルのURLを入力してください');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFileUrl(formData.fileUrl)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const updatedDocument: Document = {
      id: document?.id ?? `doc_${Date.now()}`,
      daoId,
      name: formData.name,
      type: formData.type as DocumentType,
      fileUrl: formData.fileUrl,
      hash: document?.hash ?? '0x' + Math.random().toString(16).slice(2),
      version: formData.version,
      createdAt: document?.createdAt ?? timestamp,
      updatedAt: timestamp,
      status: document?.status ?? 'active',
    };
    onSave(updatedDocument);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document ? 'ドキュメントの編集' : '新規ドキュメント追加'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            ドキュメント名
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            種類
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as DocumentType })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            required
          >
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            GitHubファイルURL（PDF）
          </label>
          <input
            type="url"
            value={formData.fileUrl}
            onChange={(e) => {
              setFormData({ ...formData, fileUrl: e.target.value });
              validateFileUrl(e.target.value);
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            required
            placeholder="https://github.com/org/repo/blob/main/docs/example.pdf"
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            GitHubにアップロードしたPDFファイルのURLを入力してください
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            バージョン
          </label>
          <input
            type="number"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            min="1"
            step="1"
            required
          />
        </div>

        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="submit"
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {document ? '保存' : '追加'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
          >
            キャンセル
          </button>
        </div>
      </form>
    </Modal>
  );
} 