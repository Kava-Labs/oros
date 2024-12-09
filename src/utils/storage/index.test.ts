import { IStorage, LStorage } from './index.ts';

describe('LocalStorage', () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    vi.resetAllMocks();
  });

  let storage: IStorage<any>;

  it('load calls "getItem" from localStorage with correct key', async() => {
    const testKey = 'testKey';
    storage = new LStorage(testKey);

    expect(localStorageMock.getItem.mock.calls.length).toBe(0);

    await storage.load();

   expect(localStorageMock.getItem.mock.calls.length).toBe(1);
   expect(localStorageMock.getItem).toBeCalledWith(testKey);
  })
})
