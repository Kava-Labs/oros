import { describe, it, expect, vi, Mock } from 'vitest';
import { getIDFromStorage, getToken, IDKEY } from './token';
import { v4 as uuidv4 } from 'uuid';

vi.mock('uuid', () => ({
  v4: vi.fn(),
}));

describe('getIDFromStorage', () => {
  it('should retrieve an existing ID from storage', () => {
    const mockStorage = {
      getItem: vi.fn().mockReturnValue('existing-id'),
      setItem: vi.fn(),
    } as unknown as Storage;

    const id = getIDFromStorage(mockStorage);

    expect(mockStorage.getItem).toHaveBeenCalledWith(IDKEY);
    expect(id).toBe('existing-id');
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  it('should generate and store a new ID if none exists in storage', () => {
    const mockStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    } as unknown as Storage;

    const mockUUID = 'new-uuid';
    (uuidv4 as Mock).mockReturnValue(mockUUID);

    const id = getIDFromStorage(mockStorage);

    expect(mockStorage.getItem).toHaveBeenCalledWith(IDKEY);
    expect(mockStorage.setItem).toHaveBeenCalledWith(IDKEY, mockUUID);
    expect(id).toBe(mockUUID);
  });

  it('should handle storage errors and fall back to in-memory UUID', () => {
    const mockStorage = {
      getItem: vi.fn().mockImplementationOnce(() => {
        throw new Error('Storage access error');
      }),
      setItem: vi.fn(),
    } as unknown as Storage;

    const mockUUID = 'fallback-uuid';
    (uuidv4 as Mock).mockReturnValue(mockUUID);

    const id = getIDFromStorage(mockStorage);

    expect(mockStorage.getItem).toHaveBeenCalledWith(IDKEY);
    expect(mockStorage.setItem).not.toHaveBeenCalled();
    expect(id).toBe(mockUUID);
  });
});

describe('getToken', () => {
  it('should generate a token combining localStorage and sessionStorage IDs', () => {
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue('local-id'),
      setItem: vi.fn(),
    } as unknown as Storage;

    const mockSessionStorage = {
      getItem: vi.fn().mockReturnValue('session-id'),
      setItem: vi.fn(),
    } as unknown as Storage;

    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.stubGlobal('sessionStorage', mockSessionStorage);

    const token = getToken();

    expect(token).toBe('kavachat:local-id:session-id');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith(IDKEY);
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith(IDKEY);
  });

  it('should handle cases where IDs need to be generated for both storages', () => {
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    } as unknown as Storage;

    const mockSessionStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    } as unknown as Storage;

    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.stubGlobal('sessionStorage', mockSessionStorage);

    const mockUUIDs = ['local-uuid', 'session-uuid'];
    (uuidv4 as Mock).mockImplementation(() => mockUUIDs.shift()!);

    const token = getToken();

    expect(token).toBe('kavachat:local-uuid:session-uuid');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith(IDKEY);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(IDKEY, 'local-uuid');
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith(IDKEY);
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(IDKEY, 'session-uuid');
  });
});
