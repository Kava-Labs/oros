import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { useDragAndDrop, UseHandleDragAndDropParams } from './useDragAndDrop';
import { renderHook } from '@testing-library/react';
import { ModelConfig, SupportedFileType } from '../types/models';

const createFileList = (files: File[]): FileList => {
  return {
    item: (index: number) => files[index],
    ...files,
    length: files.length,
  } as FileList;
};

describe('useHandleDragAndDrop', () => {
  const mockSetUploadingState = vi.fn();
  const mockHasAvailableUploads = vi.fn().mockReturnValue(true);
  const mockProcessUploadedFile = vi.fn().mockResolvedValue({});
  const mockResetUploadState = vi.fn();

  const defaultParams: UseHandleDragAndDropParams = {
    hasAvailableUploads: mockHasAvailableUploads,
    processUploadedFile: mockProcessUploadedFile,
    resetUploadState: mockResetUploadState,
    uploadedFiles: [],
    modelConfig: {
      supportedFileTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
      ] as Array<SupportedFileType>,
      maximumFileUploads: 4,
      maximumFileBytes: 8 * 1024 * 1024, // 8MB
    } as unknown as ModelConfig,
    setUploadingState: mockSetUploadingState,
  };

  const handlerMap = new Map<string, EventListener[]>();

  beforeEach(() => {
    vi.clearAllMocks();
    handlerMap.clear();

    document.addEventListener = vi.fn(
      (event: string, handler: EventListener) => {
        if (!handlerMap.has(event)) {
          handlerMap.set(event, []);
        }
        handlerMap.get(event)?.push(handler);
      },
    );

    document.removeEventListener = vi.fn(
      (event: string, handler: EventListener) => {
        const handlers = handlerMap.get(event);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index !== -1) {
            handlers.splice(index, 1);
          }
        }
      },
    );

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should register event listeners when modelSupportsUpload is true', () => {
    renderHook(() => useDragAndDrop(defaultParams));

    const registeredEvents = (document.addEventListener as Mock).mock.calls.map(
      (call) => call[0],
    );

    expect(registeredEvents).toContain('dragenter');
    expect(registeredEvents).toContain('dragover');
    expect(registeredEvents).toContain('dragleave');
    expect(registeredEvents).toContain('drop');
  });

  it('should not register event listeners when model has no maximum uploads', () => {
    renderHook(() =>
      useDragAndDrop({
        ...defaultParams,
        modelConfig: {
          ...defaultParams.modelConfig,
          maximumFileUploads: 0,
        },
      }),
    );

    expect(document.addEventListener).not.toHaveBeenCalled();
  });

  it('should unregister event listeners on unmount', () => {
    const { unmount } = renderHook(() => useDragAndDrop(defaultParams));

    unmount();

    expect(document.removeEventListener).toHaveBeenCalledTimes(4);
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'dragenter',
      expect.any(Function),
    );
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'dragover',
      expect.any(Function),
    );
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'dragleave',
      expect.any(Function),
    );
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'drop',
      expect.any(Function),
    );
  });

  describe('drag event handlers', () => {
    const triggerEvent = (
      eventType: string,
      eventData?:
        | { relatedTarget: null }
        | { dataTransfer: { items: { kind: string; type: string }[] } },
    ) => {
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        ...eventData,
      } as unknown as DragEvent;

      const handlers = handlerMap.get(eventType) || [];
      handlers.forEach((handler) => {
        handler(mockEvent);
      });

      return mockEvent;
    };

    it('should handle dragenter event with valid file type', () => {
      renderHook(() => useDragAndDrop(defaultParams));

      const mockDataTransfer = {
        items: [
          {
            kind: 'file',
            type: 'image/jpeg',
          },
        ],
      };

      const mockEvent = triggerEvent('dragenter', {
        dataTransfer: mockDataTransfer,
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockHasAvailableUploads).toHaveBeenCalled();
      expect(mockSetUploadingState).toHaveBeenCalledWith({
        isActive: true,
        isSupportedFile: true,
        errorMessage: '',
      });
    });

    it('should handle dragenter event with invalid file type', () => {
      renderHook(() => useDragAndDrop(defaultParams));

      const mockDataTransfer = {
        items: [
          {
            kind: 'file',
            type: 'application/mp4',
          },
        ],
      };

      const mockEvent = triggerEvent('dragenter', {
        dataTransfer: mockDataTransfer,
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockSetUploadingState).toHaveBeenCalledWith({
        isActive: true,
        isSupportedFile: false,
        errorMessage:
          'Invalid file type! Please upload a JPEG, PNG, or WebP image.',
      });
    });

    it('should not proceed with dragenter when hasAvailableUploads returns false', () => {
      mockHasAvailableUploads.mockReturnValueOnce(false);

      renderHook(() => useDragAndDrop(defaultParams));

      const mockDataTransfer = {
        items: [
          {
            kind: 'file',
            type: 'image/jpeg',
          },
        ],
      };

      const mockEvent = triggerEvent('dragenter', {
        dataTransfer: mockDataTransfer,
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockHasAvailableUploads).toHaveBeenCalled();
      expect(mockSetUploadingState).not.toHaveBeenCalled();
    });

    it('should handle dragover event', () => {
      renderHook(() => useDragAndDrop(defaultParams));

      const mockEvent = triggerEvent('dragover');

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockSetUploadingState).toHaveBeenCalled();
    });

    it('should handle dragleave event when leaving document', () => {
      renderHook(() => useDragAndDrop(defaultParams));

      const mockEvent = triggerEvent('dragleave', { relatedTarget: null });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockSetUploadingState).toHaveBeenCalled();
    });
  });

  describe('drop event handler', () => {
    it('should process valid dropped files', () => {
      renderHook(() => useDragAndDrop(defaultParams));

      const files = [
        new File(['content'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['content'], 'image2.png', { type: 'image/png' }),
      ];

      const fileList = createFileList(files);

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: fileList,
        },
      } as unknown as DragEvent;

      const dropHandlers = handlerMap.get('drop') || [];
      if (dropHandlers.length > 0) {
        dropHandlers[0](mockEvent);
      }

      // Test that setUploadingState is called with a function
      expect(mockSetUploadingState).toHaveBeenCalled();
      expect(typeof mockSetUploadingState.mock.calls[0][0]).toBe('function');

      // Test that the function would set isActive to false
      const updateFunction = mockSetUploadingState.mock.calls[0][0];
      const result = updateFunction({
        isActive: true,
        isSupportedFile: true,
        errorMessage: '',
      });
      expect(result.isActive).toBe(false);
      expect(mockProcessUploadedFile).toHaveBeenCalledTimes(2);
      expect(mockProcessUploadedFile).toHaveBeenCalledWith(files[0]);
      expect(mockProcessUploadedFile).toHaveBeenCalledWith(files[1]);
    });

    it('should show error when drop exceeds maximumFileUploads', () => {
      renderHook(() =>
        useDragAndDrop({
          ...defaultParams,
          uploadedFiles: [
            { id: 'existing1', fileName: 'mock1', fileType: 'image/png' },
            { id: 'existing2', fileName: 'mock2', fileType: 'image/png' },
            { id: 'existing3', fileName: 'mock3', fileType: 'image/png' },
          ],
          modelConfig: {
            ...defaultParams.modelConfig,
            maximumFileUploads: 4,
          },
        }),
      );

      const files = [
        new File(['content'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['content'], 'image2.png', { type: 'image/png' }),
      ];

      const fileList = createFileList(files);

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: fileList,
        },
      } as unknown as DragEvent;

      const dropHandlers = handlerMap.get('drop') || [];
      if (dropHandlers.length > 0) {
        dropHandlers[0](mockEvent);
      }

      expect(mockSetUploadingState).toHaveBeenCalledWith({
        isActive: true,
        isSupportedFile: false,
        errorMessage: 'Maximum 4 files allowed.',
      });

      expect(mockProcessUploadedFile).not.toHaveBeenCalled();

      // Test that reset is called after timeout
      vi.advanceTimersByTime(2000);
      expect(mockResetUploadState).toHaveBeenCalled();
    });

    it('should show error when drop contains files larger than MAX_FILE_BYTES', () => {
      renderHook(() =>
        useDragAndDrop({
          ...defaultParams,
          modelConfig: {
            ...defaultParams.modelConfig,
            maximumFileBytes: 1000, //  Small limit for testing
          },
        }),
      );

      const files = [
        new File(['x'.repeat(2000)], 'large.jpg', { type: 'image/jpeg' }),
      ];

      const fileList = createFileList(files);

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: fileList,
        },
      } as unknown as DragEvent;

      const dropHandlers = handlerMap.get('drop') || [];
      if (dropHandlers.length > 0) {
        dropHandlers[0](mockEvent);
      }

      expect(mockSetUploadingState).toHaveBeenCalledWith({
        isActive: true,
        isSupportedFile: false,
        errorMessage: 'File too large! Maximum file size is 8MB.',
      });

      expect(mockProcessUploadedFile).not.toHaveBeenCalled();

      // Test that reset is called after timeout
      vi.advanceTimersByTime(2000);
      expect(mockResetUploadState).toHaveBeenCalled();
    });
  });
});
