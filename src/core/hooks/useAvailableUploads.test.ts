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

  it('should return "hasAvailableUploads" function', () => {
    const setUploadingState = vi.fn();
    const resetUploadState = vi.fn();

    const { result } = renderHook(() =>
      useAvailableUploads({
        imageIDs: [],
        maximumFileUploads: 4,
        setUploadingState,
        resetUploadState,
      }),
    );

    expect(result.current).toHaveProperty('hasAvailableUploads');
    expect(typeof result.current.hasAvailableUploads).toBe('function');
  });

  it('should return true when imageIDs length is less than maximumFileUploads', () => {
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

    const hasAvailable = result.current.hasAvailableUploads();

    expect(hasAvailable).toBe(true);
    expect(setUploadingState).not.toHaveBeenCalled();
    expect(resetUploadState).not.toHaveBeenCalled();
  });

  it('should return false and set error state when imageIDs length equals maximumFileUploads', () => {
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

    const hasAvailable = result.current.hasAvailableUploads();

    expect(hasAvailable).toBe(false);
    expect(setUploadingState).toHaveBeenCalledWith({
      isActive: true,
      isSupportedFile: false,
      errorMessage: 'Maximum 4 files allowed.',
    });
  });

  it('should return false and set error state when imageIDs length exceeds maximumFileUploads', () => {
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

    const hasAvailable = result.current.hasAvailableUploads();

    expect(hasAvailable).toBe(false);
    expect(setUploadingState).toHaveBeenCalledWith({
      isActive: true,
      isSupportedFile: false,
      errorMessage: 'Maximum 4 files allowed.',
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

    result.current.hasAvailableUploads();

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

    result.current.hasAvailableUploads();

    expect(setUploadingState).toHaveBeenCalledWith({
      isActive: true,
      isSupportedFile: false,
      errorMessage: `Maximum ${customMaxUploads} files allowed.`,
    });
  });

  it('should re-evaluate current state when dependencies change', () => {
    const setUploadingState = vi.fn();
    const resetUploadState = vi.fn();

    //  Start with 3 images and max of 4
    const { result, rerender } = renderHook(
      (props) => useAvailableUploads(props),
      {
        initialProps: {
          imageIDs: ['image1', 'image2', 'image3'],
          maximumFileUploads: 4,
          setUploadingState,
          resetUploadState,
        },
      },
    );

    let hasAvailable = result.current.hasAvailableUploads();
    expect(hasAvailable).toBe(true);

    //  Update to 4 images (should now return false)
    rerender({
      imageIDs: ['image1', 'image2', 'image3', 'image4'],
      maximumFileUploads: 4,
      setUploadingState,
      resetUploadState,
    });

    setUploadingState.mockClear();
    resetUploadState.mockClear();

    hasAvailable = result.current.hasAvailableUploads();
    expect(hasAvailable).toBe(false);
    expect(setUploadingState).toHaveBeenCalled();
  });
});
