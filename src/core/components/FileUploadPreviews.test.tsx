import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUploadPreviews } from './FileUploadPreviews';
import { FileUpload } from './ChatInput';

// Mock only essential dependencies
vi.mock('./IdbImage', () => ({
  IdbImage: ({ id }: { id: string }) => (
    <div data-testid={`idb-image-${id}`}>Mock Image</div>
  ),
}));

vi.mock('./ButtonIcon', () => ({
  default: ({ onClick }: { onClick: () => void }) => (
    <button aria-label="remove-button" onClick={onClick}>
      X
    </button>
  ),
}));

describe('FileUploadPreviews - Delete Functionality', () => {
  const mockFiles: FileUpload[] = [
    { id: 'file1', fileName: 'file1.jpg', fileType: 'image/jpeg' },
    { id: 'file2', fileName: 'file2.jpg', fileType: 'image/jpeg' },
  ];

  const mockRemoveImage = vi.fn();
  const mockSetHoverImageId = vi.fn();

  beforeEach(() => {
    mockRemoveImage.mockClear();
  });

  it('calls removeImage with correct file id when close icon is clicked', () => {
    render(
      <FileUploadPreviews
        uploadedFiles={mockFiles}
        setHoverImageId={mockSetHoverImageId}
        removeImage={mockRemoveImage}
      />,
    );

    const removeButtons = screen.getAllByLabelText('remove-button');
    expect(removeButtons).toHaveLength(2);

    fireEvent.click(removeButtons[0]);
    expect(mockRemoveImage).toHaveBeenCalledWith('file1');

    fireEvent.click(removeButtons[1]);
    expect(mockRemoveImage).toHaveBeenCalledWith('file2');
  });
});
