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
        imageIDs: ['image1', 'image2'],
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
        imageIDs: ['image1', 'image2', 'image3', 'image4'],
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
        imageIDs: ['image1', 'image2', 'image3', 'image4', 'image5'],
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
        imageIDs: ['image1', 'image2', 'image3', 'image4', 'image5'],
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
        imageIDs: ['image1', 'image2'],
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

    // Test empty array case
    let { result } = renderHook(() =>
      useAvailableUploads({
        imageIDs: [],
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
        imageIDs: ['image1', 'image2', 'image3', 'image4'],
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
        imageIDs: [],
        maximumFileUploads: 0,
        setUploadingState,
        resetUploadState,
      }),
    ).result;
    expect(result.current()).toBe(false);
    expect(setUploadingState).toHaveBeenCalled();
  });
});
