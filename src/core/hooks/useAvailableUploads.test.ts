import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAvailableUploads } from './useAvailableUploads';
import { renderHook } from '@testing-library/react';

describe('useAvailableUploads', () => {
  const setUploadError = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('no error when imageIDs length is less than maximumFileUploads', () => {
    const { result } = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [
          { id: 'image1', fileName: 'mock 1', fileType: 'image/png' },
          { id: 'image2', fileName: 'mock2', fileType: 'image/png' },
        ],
        maximumFileUploads: 4,
        setUploadError,
      }),
    );

    expect(result.current()).toBe(true);
    expect(setUploadError).not.toHaveBeenCalled();
  });

  it('sets error state when imageIDs length equals maximumFileUploads', () => {
    const setUploadError = vi.fn();

    const { result } = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [
          { id: 'image1', fileName: 'mock 1', fileType: 'image/png' },
          { id: 'image2', fileName: 'mock 2', fileType: 'image/png' },
          { id: 'image3', fileName: 'mock 3', fileType: 'image/png' },
          { id: 'image4', fileName: 'mock 4', fileType: 'image/png' },
        ],
        maximumFileUploads: 4,
        setUploadError,
      }),
    );

    expect(result.current()).toBe(false);
    expect(setUploadError).toHaveBeenCalledWith('Maximum 4 files allowed!');
  });

  it('sets error state when imageIDs length exceeds maximumFileUploads', () => {
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
        setUploadError,
      }),
    );

    expect(result.current()).toBe(false);
    expect(setUploadError).toHaveBeenCalledWith('Maximum 4 files allowed!');
  });

  it('should update error message based on maximumFileUploads value', () => {
    const customMaxUploads = 2;

    const { result } = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [
          { id: 'image1', fileName: 'mock 1', fileType: 'image/png' },
          { id: 'image2', fileName: 'mock 2', fileType: 'image/png' },
        ],
        maximumFileUploads: customMaxUploads,
        setUploadError,
      }),
    );

    result.current();

    expect(setUploadError).toHaveBeenCalledWith(
      `Maximum ${customMaxUploads} files allowed!`,
    );
  });

  it('should handle different input scenarios correctly', () => {
    let { result } = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [],
        maximumFileUploads: 4,
        setUploadError,
      }),
    );
    expect(result.current()).toBe(true);

    setUploadError.mockClear();

    result = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [
          { id: 'image1', fileName: 'mock 1', fileType: 'image/png' },
          { id: 'image2', fileName: 'mock 2', fileType: 'image/png' },
          { id: 'image3', fileName: 'mock 3', fileType: 'image/png' },
          { id: 'image4', fileName: 'mock 4', fileType: 'image/png' },
        ],
        maximumFileUploads: 4,
        setUploadError,
      }),
    ).result;
    expect(result.current()).toBe(false);
    expect(setUploadError).toHaveBeenCalled();

    setUploadError.mockClear();

    result = renderHook(() =>
      useAvailableUploads({
        uploadedFiles: [],
        maximumFileUploads: 0,
        setUploadError,
      }),
    ).result;
    expect(result.current()).toBe(false);
    expect(setUploadError).toHaveBeenCalled();
  });
});
