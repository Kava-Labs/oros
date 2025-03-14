import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAvailableUploads } from './useAvailableUploads';
import { renderHook } from '@testing-library/react';

describe('useAvailableUploads', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should return a function that returns true when imageIDs length is less than maximumFileUploads', () => {
    const setUploadingState = vi.fn();
    const resetUploadState = vi.fn();

    const { result } = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [
          { id: 'image1', fileName: 'mock 1', fileType: 'image/png' },
          { id: 'image2', fileName: 'mock2', fileType: 'image/png' },
        ],
        maximumFileUploads: 4,
        setUploadingState,
        resetUploadState,
      }),
    );

    expect(result.current()).toBe(true);
    expect(setUploadingState).not.toHaveBeenCalled();
    expect(resetUploadState).not.toHaveBeenCalled();
  });

  it('should return a function that returns false and sets error state when imageIDs length equals maximumFileUploads', () => {
    const setUploadingState = vi.fn();
    const resetUploadState = vi.fn();

    const { result } = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [
          { id: 'image1', fileName: 'mock 1', fileType: 'image/png' },
          { id: 'image2', fileName: 'mock 2', fileType: 'image/png' },
          { id: 'image3', fileName: 'mock 3', fileType: 'image/png' },
          { id: 'image4', fileName: 'mock 4', fileType: 'image/png' },
        ],
        maximumFileUploads: 4,
        setUploadingState,
        resetUploadState,
      }),
    );

    expect(result.current()).toBe(false);
    expect(setUploadingState).toHaveBeenCalledWith({
      isActive: true,
      isSupportedFile: false,
      errorMessage: 'Maximum 4 files allowed!',
    });
  });

  it('should return a function that returns false and sets error state when imageIDs length exceeds maximumFileUploads', () => {
    const setUploadingState = vi.fn();
    const resetUploadState = vi.fn();

    const { result } = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [
          { id: 'image1', fileName: 'mock 1', fileType: 'image/png' },
          { id: 'image2', fileName: 'mock 2', fileType: 'image/png' },
          { id: 'image3', fileName: 'mock 3', fileType: 'image/png' },
          { id: 'image4', fileName: 'mock 4', fileType: 'image/png' },
          { id: 'image5', fileName: 'mock 5', fileType: 'image/png' },
        ],
        maximumFileUploads: 4,
        setUploadingState,
        resetUploadState,
      }),
    );

    expect(result.current()).toBe(false);
    expect(setUploadingState).toHaveBeenCalledWith({
      isActive: true,
      isSupportedFile: false,
      errorMessage: 'Maximum 4 files allowed!',
    });
  });

  it('should call resetUploadState after timeout when exceeding maximumFileUploads', () => {
    const setUploadingState = vi.fn();
    const resetUploadState = vi.fn();

    const { result } = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [
          { id: 'image1', fileName: 'mock 1', fileType: 'image/png' },
          { id: 'image2', fileName: 'mock 2', fileType: 'image/png' },
          { id: 'image3', fileName: 'mock 3', fileType: 'image/png' },
          { id: 'image4', fileName: 'mock 4', fileType: 'image/png' },
          { id: 'image5', fileName: 'mock 5', fileType: 'image/png' },
        ],
        maximumFileUploads: 4,
        setUploadingState,
        resetUploadState,
      }),
    );

    result.current();

    expect(resetUploadState).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);

    expect(resetUploadState).toHaveBeenCalledTimes(1);
  });

  it('should update error message based on maximumFileUploads value', () => {
    const setUploadingState = vi.fn();
    const resetUploadState = vi.fn();
    const customMaxUploads = 2;

    const { result } = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [
          { id: 'image1', fileName: 'mock 1', fileType: 'image/png' },
          { id: 'image2', fileName: 'mock 2', fileType: 'image/png' },
        ],
        maximumFileUploads: customMaxUploads,
        setUploadingState,
        resetUploadState,
      }),
    );

    result.current();

    expect(setUploadingState).toHaveBeenCalledWith({
      isActive: true,
      isSupportedFile: false,
      errorMessage: `Maximum ${customMaxUploads} files allowed!`,
    });
  });

  it('should handle different input scenarios correctly', () => {
    const setUploadingState = vi.fn();
    const resetUploadState = vi.fn();

    let { result } = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [],
        maximumFileUploads: 4,
        setUploadingState,
        resetUploadState,
      }),
    );
    expect(result.current()).toBe(true);

    setUploadingState.mockClear();
    resetUploadState.mockClear();

    result = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [
          { id: 'image1', fileName: 'mock 1', fileType: 'image/png' },
          { id: 'image2', fileName: 'mock 2', fileType: 'image/png' },
          { id: 'image3', fileName: 'mock 3', fileType: 'image/png' },
          { id: 'image4', fileName: 'mock 4', fileType: 'image/png' },
        ],
        maximumFileUploads: 4,
        setUploadingState,
        resetUploadState,
      }),
    ).result;
    expect(result.current()).toBe(false);
    expect(setUploadingState).toHaveBeenCalled();

    setUploadingState.mockClear();
    resetUploadState.mockClear();

    result = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [],
        maximumFileUploads: 0,
        setUploadingState,
        resetUploadState,
      }),
    ).result;
    expect(result.current()).toBe(false);
    expect(setUploadingState).toHaveBeenCalled();
  });
});
