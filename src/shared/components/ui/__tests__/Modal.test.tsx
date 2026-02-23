import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalClose,
} from '../Modal';

function renderModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  return render(
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Test Title</ModalTitle>
          <ModalDescription>Test Description</ModalDescription>
        </ModalHeader>
        <p>Modal body content</p>
        <ModalClose aria-label="Close">X</ModalClose>
      </ModalContent>
    </Modal>,
  );
}

describe('Modal', () => {
  it('renders title and description when open', () => {
    renderModal({ open: true });

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Modal body content')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    renderModal({ open: false });

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal body content')).not.toBeInTheDocument();
  });

  it('calls onOpenChange when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    renderModal({ open: true, onOpenChange: handleOpenChange });

    await user.click(screen.getByLabelText('Close'));
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
