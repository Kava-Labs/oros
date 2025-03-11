import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useProcessUploadedFile from './useProcessUploadedFile';

const createMockFile = (
  name: string = 'test.jpg',
  size: number = 1024,
  type: string = 'image/jpeg',
): File => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', {
    get() {
      return size;
    },
  });
  return file;
};

describe('useProcessUploadedFile', () => {
  const mockSetUploadingState = vi.fn();
  const mockResetUploadState = vi.fn();
  const mockHasAvailableUploads = vi.fn().mockReturnValue(true);
  const mockIsSupportedFileType = vi.fn().mockReturnValue(true);
  const mockSaveImage = vi.fn().mockResolvedValue('test-image-id');
  const mockSetImageIDs = vi.fn();

  const originalFileReader = global.FileReader;
  const mockFileReaderInstance = {
    readAsDataURL: vi.fn(),
    onload: vi.fn(),
  };

  const defaultParams = {
    hasAvailableUploads: mockHasAvailableUploads,
    maximumFileBytes: 8 * 1024 * 1024, // 8MB
    setUploadingState: mockSetUploadingState,
    resetUploadState: mockResetUploadState,
    isSupportedFileType: mockIsSupportedFileType,
    saveImage: mockSaveImage,
    setImageIDs: mockSetImageIDs,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // @ts-expect-error: types missing from mock
    global.FileReader = vi.fn(() => mockFileReaderInstance) as unknown as Mock;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    global.FileReader = originalFileReader;
  });

  it('should not process file if no uploads are available', async () => {
    mockHasAvailableUploads.mockReturnValueOnce(false);

    const { result } = renderHook(() => useProcessUploadedFile(defaultParams));

    const file = createMockFile();
    await act(async () => {
      await result.current(file);
    });

    expect(mockHasAvailableUploads).toHaveBeenCalled();
    expect(mockSetUploadingState).not.toHaveBeenCalled();
    expect(mockResetUploadState).not.toHaveBeenCalled();
  });

  it('should reject files that are too large', async () => {
    //  9MB
    const oversizedFile = createMockFile('large.jpg', 9 * 1024 * 1024);

    const { result } = renderHook(() => useProcessUploadedFile(defaultParams));

    await act(async () => {
      await result.current(oversizedFile);
    });

    expect(mockSetUploadingState).toHaveBeenCalledWith({
      isActive: true,
      isSupportedFile: false,
      errorMessage: 'File too large! Maximum file size is 8MB.',
    });

    expect(mockResetUploadState).not.toHaveBeenCalled();

    //  Trigger the timeout
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockResetUploadState).toHaveBeenCalled();
  });

  it('should reject unsupported file types', async () => {
    mockIsSupportedFileType.mockReturnValueOnce(false);

    const unsupportedFile = createMockFile(
      'document.mp4',
      500,
      'application/mp4',
    );

    const { result } = renderHook(() => useProcessUploadedFile(defaultParams));

    await act(async () => {
      await result.current(unsupportedFile);
    });

    expect(mockIsSupportedFileType).toHaveBeenCalledWith('application/mp4');
    expect(mockSetUploadingState).toHaveBeenCalledWith({
      isActive: true,
      isSupportedFile: false,
      errorMessage:
        'Invalid file type! Please upload a JPEG, PNG, or WebP image.',
    });

    //  Trigger the timeout
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockResetUploadState).toHaveBeenCalled();
  });

  it('should process valid files correctly', async () => {
    const validFile = createMockFile();

    const { result } = renderHook(() => useProcessUploadedFile(defaultParams));

    await act(async () => {
      await result.current(validFile);
    });

    expect(mockResetUploadState).toHaveBeenCalled();
    expect(mockFileReaderInstance.readAsDataURL).toHaveBeenCalledWith(
      validFile,
    );

    await act(async () => {
      if (mockFileReaderInstance.onload) {
        mockFileReaderInstance.onload({
          target: { result: 'data:image/jpeg;base64,testdata' },
        } as unknown as Mock);
      }
    });

    expect(mockSaveImage).toHaveBeenCalledWith(
      'data:image/jpeg;base64,testdata',
    );
    expect(mockSetImageIDs).toHaveBeenCalled();
  });

  it('should not call readAsDataURL if file validation fails', async () => {
    mockHasAvailableUploads.mockReturnValueOnce(false);

    const { result } = renderHook(() => useProcessUploadedFile(defaultParams));

    const file = createMockFile();
    await act(async () => {
      await result.current(file);
    });

    expect(mockFileReaderInstance.readAsDataURL).not.toHaveBeenCalled();
  });
});
