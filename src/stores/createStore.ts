export interface StateStore<T> {
  getState: () => T;
  setState: (val: ((prev: T) => T) | T) => void;

  subscribe: (listener: () => void) => () => void;
  getSubscriberCount: () => number;
}

export const createStore = <T>(initialValue: T): StateStore<T> => {
  const subscribers = new Set<() => void>();

  const state = {
    current: deepCopy(initialValue),
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
      state.current = deepCopy(newVal);
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

export const deepCopy = (val: unknown) => {
  // spread operator doesn't do a deep copy
  // it also doesn't work with primitive types
  try {
    // some older browsers may not have structuredClone
    // It's been available across browsers since early 2022 but just
    // in case this function is not available we fallback to JSON stringify then parse
    if (window.structuredClone) {
      return window.structuredClone(val);
    }
    return JSON.parse(JSON.stringify(val));
  } catch (err) {
    // rethrow the error with a different message
    throw new Error(`provided data must be serializable: ${val}`);
  }
};
