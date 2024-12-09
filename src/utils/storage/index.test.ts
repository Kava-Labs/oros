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

  it('load calls "getItem" from localStorage', async() => {
    storage = new LStorage('test');

    expect(localStorageMock.getItem.mock.calls.length).toBe(0);

    await storage.load();

   expect(localStorageMock.getItem.mock.calls.length).toBe(1);
  })
})
