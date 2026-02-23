'use client';

import { useMemo } from 'react';
import { useDocuments } from './useDocuments';
import { isRegulationType, type DocumentType, type Document } from '../types';

/**
 * Find the latest active document for a given DAO + documentType.
 * For regulation types (except custom_rules), only one active version should exist.
 * For custom_rules, matches by title.
 */
export function useExistingRegulation(
  daoId: string,
  documentType: DocumentType | undefined,
  title?: string,
) {
  const { data: documents, isLoading } = useDocuments({ daoId });

  const latestActive = useMemo((): Document | null => {
    if (!documents || !documentType || !isRegulationType(documentType)) return null;

    const candidates = (documents as Document[]).filter(
      (doc) => doc.documentType === documentType && doc.status === 'active',
    );

    if (documentType === 'custom_rules' && title) {
      // custom_rules: match by title
      const match = candidates.find((doc) => doc.title === title);
      return match ?? null;
    }

    // For standard regulation types, find the latest (highest version)
    if (candidates.length === 0) return null;
    return candidates.reduce((latest, doc) => (doc.version > latest.version ? doc : latest));
  }, [documents, documentType, title]);

  const hasExisting = latestActive !== null;
  const isAmendment = hasExisting;

  return {
    latestActive,
    hasExisting,
    isAmendment,
    isLoading,
  };
}
