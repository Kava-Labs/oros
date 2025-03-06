import 'fake-indexeddb/auto';
import { idbDatabase, saveImage, getImage, deleteImages } from './idb';

afterAll(() => {
  vi.restoreAllMocks();
});

describe('IndexedDB Operations', () => {
  it('should initialize the database using idbDatabase', async () => {
    const db = await idbDatabase();
    expect(db).toBeDefined();
    expect(db.name).toBe('kavachat');
    expect(db.version).toBe(1);

    // Check if the image object store was created.
    const objectStoreNames = Array.from(db.objectStoreNames);
    expect(objectStoreNames).toContain('image');
  });

  it('should save an image and retrieve it', async () => {
    const base64Img = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'; // sample data

    // Save an image
    const savedId = await saveImage(base64Img);
    expect(savedId).toBeDefined();
    expect(typeof savedId).toBe('string');

    // Retrieve the image
    const retrieved = await getImage(savedId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(savedId);
    expect(retrieved?.data).toBe(base64Img);
  });

  it('deleteImages should clear out the image store', async () => {
    const base64Img = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'; // sample data

    const savedId = await saveImage(base64Img);
    expect(savedId).toBeDefined();
    expect(typeof savedId).toBe('string');

    const retrieved = await getImage(savedId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(savedId);
    expect(retrieved?.data).toBe(base64Img);

    await deleteImages();

    expect(await getImage(savedId)).toBeUndefined();
  });

  it('should return undefined if the requested image does not exist', async () => {
    const nonExistentId = 'some-non-existent-id';
    const result = await getImage(nonExistentId);
    expect(result).toBeUndefined();
  });
});
