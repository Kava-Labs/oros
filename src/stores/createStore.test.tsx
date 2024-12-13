import { describe, it, expect, vi } from 'vitest';
import { createStore, deepCopy, StateStore } from './createStore';
import React, { FC } from 'react';
import { render, screen, act } from '@testing-library/react';
import { useSyncExternalStore } from 'react';

describe('createStore', () => {
  it('should initialize with the given initial value', () => {
    const counterStore = createStore<number>(1);
    expect(counterStore.getState()).toEqual(1);
  });

  it('should update the state and notify subscribers', () => {
    const counterStore = createStore<number>(1);
    const subscriber = vi.fn();
    counterStore.subscribe(subscriber);

    counterStore.setState(2);

    expect(counterStore.getState()).toEqual(2);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should not notify subscribers if the new value is the same', () => {
    const counterStore = createStore<number>(1);
    const subscriber = vi.fn();
    counterStore.subscribe(subscriber);

    counterStore.setState(1);

    expect(counterStore.getState()).toEqual(1);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should handle unsubscribing correctly', () => {
    const counterStore = createStore<number>(1);
    const subscriber = vi.fn();
    const unsubscribe = counterStore.subscribe(subscriber);

    unsubscribe();
    counterStore.setState(2);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('subscribers should be called if the state changed by reference for non primitive types', () => {
    const numberStore = createStore<number[]>([]);
    const subscriber = vi.fn();
    numberStore.subscribe(subscriber);

    numberStore.setState([1, 2, 3]);

    expect(numberStore.getState()).toEqual([1, 2, 3]);
    expect(subscriber).toHaveBeenCalledTimes(1);

    numberStore.setState([1, 2, 3]);

    // this demonstrates that the store works by reference
    // for non primitive types even though the array contents are the same
    expect(subscriber).toHaveBeenCalledTimes(2);
  });

  it('set state with callback should pass the current state value', () => {
    const store = createStore<string[]>(['hello']);

    expect(store.getState()).toStrictEqual(['hello']);
    expect(store.getSubscriberCount()).toBe(0);
    const subscribe = vi.fn();
    store.subscribe(subscribe);
    expect(store.getSubscriberCount()).toBe(1);

    store.setState((prev) => {
      expect(prev).toStrictEqual(['hello']);
      return [...prev, 'world'];
    });

    expect(subscribe).toHaveBeenCalledOnce();
    expect(store.getState()).toStrictEqual(['hello', 'world']);
  });
});

const useStoreValue = <T,>(store: StateStore<T>) => {
  const value = useSyncExternalStore(store.subscribe, store.getState);
  return [value, store.setState] as const;
};

// A test component that uses our store
interface TestComponentProps<T> {
  store: StateStore<T>;
}
const TestComponent = <T,>({ store }: TestComponentProps<T>) => {
  const [value] = useStoreValue(store);
  return <div data-testid="store-value">{JSON.stringify(value)}</div>;
};

describe('createStore integration with useSyncExternalStore', () => {
  it('renders with initial value', () => {
    const store = createStore('initial');
    render(<TestComponent store={store} />);
    const el = screen.getByTestId('store-value');
    expect(el.textContent).toBe('"initial"');
    expect(store.getSubscriberCount()).toBe(1);
  });

  it('rerenders when store updates', () => {
    const store = createStore('initial');
    render(<TestComponent store={store} />);
    const el = screen.getByTestId('store-value');
    expect(el.textContent).toBe('"initial"');

    act(() => {
      store.setState('updated');
    });

    expect(el.textContent).toBe('"updated"');
  });

  it('does not rerender if same value is set', () => {
    const store = createStore('fixed');
    const renderSpy = vi.fn();
    const SpyComponent: FC = () => {
      const [value] = useStoreValue(store);
      renderSpy(value); // cool trick to see how many times we re-render
      return <div data-testid="store-value">{value}</div>;
    };

    render(<SpyComponent />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    act(() => {
      store.setState('fixed');
    });
    // should still be one
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it('supports complex values (objects) and triggers re-render on update', () => {
    const initialObj = { a: 1, b: { c: { d: { f: { x: 'y' } } } } };
    const store = createStore(initialObj);

    render(<TestComponent store={store} />);
    const el = screen.getByTestId('store-value');
    expect(el.textContent).toBe(JSON.stringify(initialObj));

    const newObj = { a: 4, b: { c: { d: { f: { x: 'y' } } } } };
    act(() => {
      store.setState(newObj);
    });
    expect(el.textContent).toBe(JSON.stringify(newObj));
  });

  it('unsubscribe works when component unmounts', () => {
    const store = createStore('initial');
    const { unmount } = render(<TestComponent store={store} />);
    const el = screen.getByTestId('store-value');
    expect(el.textContent).toBe('"initial"');

    unmount();

    expect(store.getSubscriberCount()).toBe(0);
  });

  it('multiple components using the same store update simultaneously', () => {
    const store = createStore(0);

    const MultiComponent: FC = () => {
      const [value] = useStoreValue(store);
      return <span>{value}</span>;
    };

    render(
      <>
        <div data-testid="c1">
          <MultiComponent />
        </div>
        <div data-testid="c2">
          <MultiComponent />
        </div>
      </>,
    );

    const c1 = screen.getByTestId('c1');
    const c2 = screen.getByTestId('c2');

    expect(store.getSubscriberCount()).toBe(2);

    expect(c1.textContent).toBe('0');
    expect(c2.textContent).toBe('0');

    act(() => {
      store.setState(42);
    });

    expect(c1.textContent).toBe('42');
    expect(c2.textContent).toBe('42');
  });

  it('multiple updates trigger multiple re-renders in sequence', () => {
    const store = createStore('start');
    let renderCount = 0;

    const CountingComponent: FC = () => {
      const [value] = useStoreValue(store);
      React.useEffect(() => {
        renderCount++;
      });
      return <div>{value}</div>;
    };

    render(<CountingComponent />);
    expect(renderCount).toBe(1);

    act(() => {
      store.setState('one');
    });
    expect(renderCount).toBe(2);

    act(() => {
      store.setState('two');
    });
    expect(renderCount).toBe(3);

    expect(store.getSubscriberCount()).toBe(1);
  });
});

describe('deepCopy', () => {
  test('should create a deep copy of a simple object', () => {
    const obj = { a: 1, b: { c: 2 } };
    const copy = deepCopy(obj);

    expect(copy).toEqual(obj);
    expect(copy).not.toBe(obj);
    expect(copy.b).not.toBe(obj.b);
  });

  test('should create a deep copy of an array', () => {
    const arr = [1, 2, { a: 3 }];
    const copy = deepCopy(arr);

    expect(copy).toEqual(arr);
    expect(copy).not.toBe(arr);
    expect(copy[2]).not.toBe(arr[2]);
  });

  test('should handle primitive values', () => {
    expect(deepCopy(42)).toBe(42);
    expect(deepCopy('string')).toBe('string');
    expect(deepCopy(null)).toBeNull();
    expect(deepCopy(undefined)).toBeUndefined();
  });

  test('should throw an error for non-serializable values', () => {
    const fn = function () {};

    expect(() => deepCopy(fn)).toThrow(
      `provided data must be serializable: ${fn}`,
    );
  });

  test('should create a deep copy when structuredClone is available', () => {
    const originalStructuredClone = window.structuredClone;
    const mockStructuredClone = vi.fn((val) => val);
    window.structuredClone = mockStructuredClone;

    const obj = { a: 1 };
    const copy = deepCopy(obj);

    expect(mockStructuredClone).toHaveBeenCalledWith(obj);
    expect(copy).toBe(obj);

    window.structuredClone = originalStructuredClone; // Restore original structuredClone
  });

  test('should fallback to JSON methods if structuredClone is not available', () => {
    const originalStructuredClone = window.structuredClone;
    // @ts-expect-error
    window.structuredClone = undefined;

    const obj = { a: 1, b: { c: 2 } };
    const copy = deepCopy(obj);

    expect(copy).toEqual(obj);
    expect(copy).not.toBe(obj);

    window.structuredClone = originalStructuredClone; // Restore original structuredClone
  });
});
