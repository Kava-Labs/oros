class ImageDB {
  private store: Record<string, Promise<string>>;

  constructor() {
    this.store = {};
  }

  public set(id: string, uri: Promise<string>): void {
    this.store[id] = uri;
  }

  public get(id: string): Promise<string> {
    return this.store[id];
  }

  public clear(): void {
    this.store = {};
  }
}

export const imagedb = new ImageDB();
