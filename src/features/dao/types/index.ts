import { z } from 'zod';

export interface DAO {
  id: string; // EAS attestation UID
  name: string;
  description: string;
  location: string;
  memberCount: number;
  size: string;
  status: 'active' | 'inactive' | 'pending';
  logoUrl: string;
  website: string;
  contactPerson: string;
  contactEmail: string;
  adminAddress: string;
  attestationUID: string;
  trustScore: number;
  foundingDate: number;
  createdAt: string;
  updatedAt: string;
  documentCount?: number;
}

export const createDAOSchema = z.object({
  name: z.string().min(1, 'DAO名は必須です').max(100, 'DAO名は100文字以内で入力してください'),
  description: z.string().min(1, '説明は必須です').max(500, '説明は500文字以内で入力してください'),
  location: z.string().min(1, '所在地は必須です'),
  memberCount: z.number().min(1, 'メンバー数は1以上で入力してください'),
  size: z.enum(['small', 'medium', 'large']),
  logoUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  website: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  contactPerson: z.string().optional(),
  contactEmail: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .optional()
    .or(z.literal('')),
});

export type CreateDAOFormData = z.infer<typeof createDAOSchema>;

export const updateDAOSchema = createDAOSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional(),
});

export type UpdateDAOFormData = z.infer<typeof updateDAOSchema>;
