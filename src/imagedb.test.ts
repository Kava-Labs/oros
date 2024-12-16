import { imagedb } from './imagedb';

describe('ImageDB', () => {
  afterEach(() => {
    // Clear the store after each test to ensure test isolation
    imagedb.clear();
  });

  it('should set and get a promise by ID', async () => {
    const imageId = 'testImage';
    const imageUri = Promise.resolve('http://example.com/image.jpg');

    imagedb.set(imageId, imageUri);

    const retrievedUri = await imagedb.get(imageId);
    expect(retrievedUri).toBe('http://example.com/image.jpg');
  });

  it('should return undefined for unknown IDs', async () => {
    const nonExistentId = 'nonExistentImage';
    const result = imagedb.get(nonExistentId);
    expect(result).toBeUndefined();
  });

  it('should clear the store', async () => {
    const imageId = 'anotherImage';
    const imageUri = Promise.resolve('http://example.com/another.jpg');
    imagedb.set(imageId, imageUri);

    // Ensure the image can be retrieved first
    const retrievedBeforeClear = await imagedb.get(imageId);
    expect(retrievedBeforeClear).toBe('http://example.com/another.jpg');

    // Now clear and expect empty
    imagedb.clear();

    // Attempt to get should be undefined now
    const retrievedAfterClear = imagedb.get(imageId);
    expect(retrievedAfterClear).toBeUndefined();
  });

  it('should overwrite existing IDs when set is called twice', async () => {
    const imageId = 'overwriteImage';
    const initialUri = Promise.resolve('http://example.com/initial.jpg');
    const newUri = Promise.resolve('http://example.com/new.jpg');

    imagedb.set(imageId, initialUri);

    // Ensure initial value is correct
    const initialRetrieved = await imagedb.get(imageId);
    expect(initialRetrieved).toBe('http://example.com/initial.jpg');

    // Overwrite with new value
    imagedb.set(imageId, newUri);

    const newRetrieved = await imagedb.get(imageId);
    expect(newRetrieved).toBe('http://example.com/new.jpg');
  });

  it('should handle async promises correctly', async () => {
    const imageId = 'asyncImage';
    const imageUri = new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('http://example.com/delayed.jpg');
      }, 50);
    });

    imagedb.set(imageId, imageUri);

    const retrieved = await imagedb.get(imageId);
    expect(retrieved).toBe('http://example.com/delayed.jpg');
  });
});
