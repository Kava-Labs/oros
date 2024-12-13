export interface StateStore<T> {
  getState: () => T;
  setState: (newValue: T) => void;

  subscribe: (listener: () => void) => () => void;
  getSubscriberCount: () => number;
}

export const createStore = <T>(initialValue: T): StateStore<T> => {
  let currentValue = initialValue;
  const subscribers = new Set<() => void>();

  const state = {
    current: currentValue,
  };

  const subscribe = (listener: () => void) => {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  };

  const getState = () => state.current;

  const setState = (newValue: T) => {
    if (newValue !== state.current) {
      state.current = structuredClone(newValue);
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
