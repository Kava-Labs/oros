import { TextStreamStore } from './textStreamStore';

describe('TextStreamStore', () => {
  it('should return an empty string initially', () => {
    const store = new TextStreamStore();
    expect(store.getSnapshot()).toBe('');
  });

  it('should allow setting text', () => {
    const store = new TextStreamStore();
    store.setText('Hello, world!');
    expect(store.getSnapshot()).toBe('Hello, world!');
  });

  it('should allow appending text', () => {
    const store = new TextStreamStore();
    store.setText('Hello');
    store.appendText(', world!');
    expect(store.getSnapshot()).toBe('Hello, world!');
  });

  it('should call listeners when text is set', () => {
    const store = new TextStreamStore();
    const listener = vi.fn();

    store.subscribe(listener);
    store.setText('New text');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should call listeners when text is appended', () => {
    const store = new TextStreamStore();
    const listener = vi.fn();

    store.subscribe(listener);
    store.appendText('Appending text');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should call all subscribed listeners on change', () => {
    const store = new TextStreamStore();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    store.subscribe(listener1);
    store.subscribe(listener2);

    store.setText('Trigger Change');
    store.appendText(' And Another Change');
    expect(listener1).toHaveBeenCalledTimes(2);
    expect(listener2).toHaveBeenCalledTimes(2);
  });

  it('should not call unsubscribed listeners', () => {
    const store = new TextStreamStore();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    // Subscribe both
    const unsubscribe1 = store.subscribe(listener1);
    store.subscribe(listener2);

    // Unsubscribe listener1
    unsubscribe1();

    store.setText('Another Change');
    store.appendText(' And Some More Change');

    // listener1 should not be called again
    expect(listener1).toHaveBeenCalledTimes(0);
    // listener2 should be called once
    expect(listener2).toHaveBeenCalledTimes(2);
  });

  it('should handle multiple changes and call listeners each time', () => {
    const store = new TextStreamStore();
    const listener = vi.fn();

    store.subscribe(listener);
    store.setText('First');
    store.appendText(' Second');
    store.setText('Third');

    // Listener should be called once per change
    expect(listener).toHaveBeenCalledTimes(3);
    expect(store.getSnapshot()).toBe('Third');
  });
});
