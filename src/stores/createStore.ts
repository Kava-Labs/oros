export interface StateStore<T> {
  getState: () => T;
  setState: (val: ((prev: T) => T) | T) => void;

  subscribe: (listener: () => void) => () => void;
  getSubscriberCount: () => number;
}

export const createStore = <T>(initialValue: T): StateStore<T> => {
  const subscribers = new Set<() => void>();

  const state = {
    current: structuredClone(initialValue),
  };

  const subscribe = (listener: () => void) => {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  };

  const getState = () => state.current;

  const setState = (val: ((prev: T) => T) | T) => {
    let newVal;
    if (typeof val === 'function') {
      newVal = (val as (prev: T) => T)(state.current);
    } else {
      newVal = val;
    }

    if (newVal !== state.current) {
      state.current = structuredClone(newVal);
      for (const fn of subscribers) fn();
    }
  };

  const getSubscriberCount = () => {
    return subscribers.size;
  };

  return {
    subscribe,
    getSubscriberCount,
    getState,
    setState,
  };
};
