'use client';

import { useState } from 'react';
import { DAO } from '@/types';
import Modal from './Modal';

interface EditDaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  dao: DAO;
  onSave: (updatedDao: DAO) => void;
}

export default function EditDaoModal({ isOpen, onClose, dao, onSave }: EditDaoModalProps) {
  const [formData, setFormData] = useState({
    name: dao.name,
    location: dao.location,
    description: dao.description,
    size: dao.size,
    memberCount: dao.memberCount,
    website: dao.website || '',
    logoUrl: dao.logoUrl || '',
    contactEmail: dao.contactEmail || '',
    contactPerson: dao.contactPerson || '',
    status: dao.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDao: DAO = {
      ...dao,
      ...formData,
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedDao);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="DAO情報の編集">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            DAO名
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
            所在地
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            規模
          </label>
          <select
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value as 'small' | 'medium' | 'large' })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            required
          >
            <option value="small">小規模</option>
            <option value="medium">中規模</option>
            <option value="large">大規模</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            メンバー数
          </label>
          <input
            type="number"
            value={formData.memberCount}
            onChange={(e) => setFormData({ ...formData, memberCount: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            説明
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            ウェブサイト
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://example.com"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            ロゴURL
          </label>
          <input
            type="url"
            value={formData.logoUrl}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            placeholder="https://example.com/logo.png"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">
            画像のURLを入力してください。空の場合はデフォルトロゴが使用されます。
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            担当者名
          </label>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="山田太郎"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            連絡先メールアドレス
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            placeholder="contact@dao.example.com"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            ステータス
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'pending' })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            required
          >
            <option value="active">運営中</option>
            <option value="pending">審査中</option>
            <option value="inactive">停止中</option>
          </select>
        </div>

        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="submit"
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
          >
            保存
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