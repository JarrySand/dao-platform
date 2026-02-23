import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorDisplay } from '../ErrorDisplay';

describe('ErrorDisplay', () => {
  it('renders error message with role="alert"', () => {
    render(<ErrorDisplay message="Something went wrong" />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Something went wrong');
  });

  it('renders retry button that calls onRetry when clicked', async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();

    render(<ErrorDisplay message="Failed to load" onRetry={handleRetry} />);

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    expect(retryButton).toBeInTheDocument();

    await user.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorDisplay message="Error occurred" />);
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });
});
