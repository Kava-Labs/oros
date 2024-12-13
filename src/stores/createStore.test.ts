import { describe, it, expect, vi } from 'vitest';
import { createStore } from './createStore';

describe('createStore', () => {
  it('should initialize with the given initial value', () => {
    const counterStore = createStore<number>(1);
    expect(counterStore.getCurrent()).toEqual(1);
  });

  it('should update the state and notify subscribers', () => {
    const counterStore = createStore<number>(1);
    const subscriber = vi.fn();
    counterStore.subscribe(subscriber);

    counterStore.setValue(2);

    expect(counterStore.getCurrent()).toEqual(2);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should not notify subscribers if the new value is the same', () => {
    const counterStore = createStore<number>(1);
    const subscriber = vi.fn();
    counterStore.subscribe(subscriber);

    counterStore.setValue(1);

    expect(counterStore.getCurrent()).toEqual(1);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should handle unsubscribing correctly', () => {
    const counterStore = createStore<number>(1);
    const subscriber = vi.fn();
    const unsubscribe = counterStore.subscribe(subscriber);

    unsubscribe();
    counterStore.setValue(2);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('subscribers should be called if the state changed by reference for non primitive types', () => {
    const numberStore = createStore<number[]>([]);
    const subscriber = vi.fn();
    numberStore.subscribe(subscriber);

    numberStore.setValue([1, 2, 3]);

    expect(numberStore.getCurrent()).toEqual([1, 2, 3]);
    expect(subscriber).toHaveBeenCalledTimes(1);

    numberStore.setValue([1, 2, 3]);

    // this demonstrates that the store works by reference
    // for non primitive types even though the array contents are the same
    expect(subscriber).toHaveBeenCalledTimes(2);
  });
});
