import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentCard } from '../DocumentCard';
import { createMockDocument, renderWithProviders } from '@/test/utils';

// Mock ExplorerLink to simplify assertions
vi.mock('@/shared/components/ExplorerLink', () => ({
  ExplorerLink: ({ value, type }: { value: string; type: string }) => (
    <a href={`https://explorer.example/${type}/${value}`} target="_blank" rel="noopener noreferrer">
      {value.slice(0, 10)}...
    </a>
  ),
}));

describe('DocumentCard', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('renders document title', () => {
    const doc = createMockDocument({ title: 'DAO Constitution v1' });

    renderWithProviders(<DocumentCard document={doc} />);

    expect(screen.getByText('DAO Constitution v1')).toBeInTheDocument();
  });

  it('shows document type badge for articles', () => {
    const doc = createMockDocument({ documentType: 'articles' });

    renderWithProviders(<DocumentCard document={doc} />);

    expect(screen.getByText('定款')).toBeInTheDocument();
  });

  it('shows document type badge for minutes', () => {
    const doc = createMockDocument({ documentType: 'minutes' });

    renderWithProviders(<DocumentCard document={doc} />);

    expect(screen.getByText('議事録')).toBeInTheDocument();
  });

  it('shows document type badge for proposal', () => {
    const doc = createMockDocument({ documentType: 'proposal' });

    renderWithProviders(<DocumentCard document={doc} />);

    expect(screen.getByText('投票議題')).toBeInTheDocument();
  });

  it('shows active status badge when document is active', () => {
    const doc = createMockDocument({ status: 'active' });

    renderWithProviders(<DocumentCard document={doc} />);

    expect(screen.getByText('有効')).toBeInTheDocument();
  });

  it('shows revoked status badge when document is revoked', () => {
    const doc = createMockDocument({ status: 'revoked' });

    renderWithProviders(<DocumentCard document={doc} />);

    expect(screen.getByText('失効')).toBeInTheDocument();
  });

  it('displays version number', () => {
    const doc = createMockDocument({ version: 3 });

    renderWithProviders(<DocumentCard document={doc} />);

    expect(screen.getByText('v3')).toBeInTheDocument();
  });

  it('opens IPFS download URL when download button is clicked', async () => {
    const user = userEvent.setup();
    const doc = createMockDocument({ ipfsCid: 'QmTestDownloadCid' });

    renderWithProviders(<DocumentCard document={doc} />);

    const downloadButton = screen.getByText('ダウンロード');
    await user.click(downloadButton);

    expect(window.open).toHaveBeenCalledWith(
      'https://gateway.pinata.cloud/ipfs/QmTestDownloadCid',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('shows revoke button when isAdmin is true and document is active', () => {
    const doc = createMockDocument({ status: 'active' });
    const handleRevoke = vi.fn();

    renderWithProviders(<DocumentCard document={doc} isAdmin onRevoke={handleRevoke} />);

    expect(screen.getByText('失効')).toBeInTheDocument();
    // The revoke button has text "失効" (same as revoked badge text)
    // But it's a button element, so we look specifically for the button
    const revokeButton = screen.getByRole('button', { name: '失効' });
    expect(revokeButton).toBeInTheDocument();
  });

  it('calls onRevoke with document id when revoke button is clicked', async () => {
    const user = userEvent.setup();
    const doc = createMockDocument({
      id: '0xrevoke123',
      status: 'active',
    });
    const handleRevoke = vi.fn();

    renderWithProviders(<DocumentCard document={doc} isAdmin onRevoke={handleRevoke} />);

    const revokeButton = screen.getByRole('button', { name: '失効' });
    await user.click(revokeButton);

    expect(handleRevoke).toHaveBeenCalledWith('0xrevoke123');
  });

  it('does not show revoke button when isAdmin is false', () => {
    const doc = createMockDocument({ status: 'active' });

    renderWithProviders(<DocumentCard document={doc} />);

    expect(screen.queryByRole('button', { name: '失効' })).not.toBeInTheDocument();
  });

  it('does not show revoke button when document is revoked even if admin', () => {
    const doc = createMockDocument({ status: 'revoked' });
    const handleRevoke = vi.fn();

    renderWithProviders(<DocumentCard document={doc} isAdmin onRevoke={handleRevoke} />);

    expect(screen.queryByRole('button', { name: '失効' })).not.toBeInTheDocument();
  });

  it('shows voting transaction summary when votingTxHash is present', () => {
    const doc = createMockDocument({
      votingTxHash: '0x' + 'ab'.repeat(32),
      votingChainId: 11155111,
    });

    renderWithProviders(<DocumentCard document={doc} />);

    expect(screen.getByText('投票トランザクション')).toBeInTheDocument();
  });
});
