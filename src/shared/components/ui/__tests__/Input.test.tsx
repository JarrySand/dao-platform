import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('renders with a label linked to the input', () => {
    render(<Input label="Email" />);

    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('displays error message with role="alert"', () => {
    render(<Input label="Email" error="Email is required" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Email is required');

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('fires onChange handler when typing', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input label="Name" onChange={handleChange} />);
    await user.type(screen.getByLabelText('Name'), 'hello');

    expect(handleChange).toHaveBeenCalledTimes(5);
  });

  it('displays helperText when no error is present', () => {
    render(<Input label="Username" helperText="Must be unique" />);

    expect(screen.getByText('Must be unique')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders left and right icons', () => {
    render(
      <Input
        label="Search"
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
      />,
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
});
