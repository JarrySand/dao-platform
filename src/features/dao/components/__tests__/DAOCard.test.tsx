import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DAOCard } from '../DAOCard';
import { createMockDAO } from '@/test/utils';

// Mock next/link to render a plain anchor tag
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('DAOCard', () => {
  it('renders DAO name and description', () => {
    const dao = createMockDAO({
      name: 'My Test DAO',
      description: 'A short description for testing.',
    });

    render(<DAOCard dao={dao} />);

    expect(screen.getByText('My Test DAO')).toBeInTheDocument();
    expect(screen.getByText('A short description for testing.')).toBeInTheDocument();
  });

  it('shows active status badge', () => {
    const dao = createMockDAO({ status: 'active' });

    render(<DAOCard dao={dao} />);

    expect(screen.getByText('アクティブ')).toBeInTheDocument();
  });

  it('shows inactive status badge', () => {
    const dao = createMockDAO({ status: 'inactive' });

    render(<DAOCard dao={dao} />);

    expect(screen.getByText('非アクティブ')).toBeInTheDocument();
  });

  it('shows pending status badge', () => {
    const dao = createMockDAO({ status: 'pending' });

    render(<DAOCard dao={dao} />);

    expect(screen.getByText('保留中')).toBeInTheDocument();
  });

  it('truncates descriptions longer than 100 characters', () => {
    const longDescription = 'A'.repeat(150);
    const dao = createMockDAO({ description: longDescription });

    render(<DAOCard dao={dao} />);

    const expected = 'A'.repeat(100) + '...';
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('does not truncate descriptions with exactly 100 characters', () => {
    const description = 'B'.repeat(100);
    const dao = createMockDAO({ description });

    render(<DAOCard dao={dao} />);

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('wraps in a link to DAO detail page when onClick is not provided', () => {
    const dao = createMockDAO({ id: '0xabc123' });

    render(<DAOCard dao={dao} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/daos/0xabc123');
  });

  it('does not wrap in a link when onClick is provided', () => {
    const dao = createMockDAO();
    const handleClick = vi.fn();

    render(<DAOCard dao={dao} onClick={handleClick} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('calls onClick when provided and card is clicked', async () => {
    const user = userEvent.setup();
    const dao = createMockDAO({ name: 'Clickable DAO' });
    const handleClick = vi.fn();

    render(<DAOCard dao={dao} onClick={handleClick} />);

    await user.click(screen.getByText('Clickable DAO'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('displays document count when available', () => {
    const dao = createMockDAO({ documentCount: 7 });

    render(<DAOCard dao={dao} />);

    expect(screen.getByText('7 ドキュメント')).toBeInTheDocument();
  });

  it('does not display document count badge when documentCount is undefined', () => {
    const dao = createMockDAO({ documentCount: undefined });

    render(<DAOCard dao={dao} />);

    expect(screen.queryByText(/ドキュメント/)).not.toBeInTheDocument();
  });
});
