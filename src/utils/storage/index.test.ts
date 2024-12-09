import { LStorage } from './index.ts';

describe('LocalStorage', () => {
  it('load calls "getItem" once with correct key', async () => {
    const storage = new LStorage('testKey');

    localStorage.setItem('testKey', 'testValue');

    const result = await storage.load();

    expect(result).toBe('testValue')
  });
})
