import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '../Alert';

describe('Alert', () => {
  it('renders with message and has role="alert"', () => {
    render(<Alert>Something happened</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Something happened');
  });

  it('applies variant-specific class', () => {
    const { rerender } = render(<Alert variant="error">Error alert</Alert>);
    expect(screen.getByRole('alert').className).toContain('border-[var(--color-danger)]');

    rerender(<Alert variant="success">Success alert</Alert>);
    expect(screen.getByRole('alert').className).toContain('border-[var(--color-success)]');
  });

  it('renders close button when closable and removes alert on click', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Alert closable onClose={handleClose}>
        Dismissible
      </Alert>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Close'));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when closable is false', () => {
    render(<Alert>Not closable</Alert>);
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });
});
