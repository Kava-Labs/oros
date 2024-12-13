export interface StateStore<T> {
  getState: () => T;
  setState: (newValue: T) => void;

  subscribe: (listener: () => void) => () => void;
  getSubscriberCount: () => number;
}

export const createStore = <T>(initialValue: T): StateStore<T> => {
  let currentValue = initialValue;
  const subscribers = new Set<() => void>();

  const stateProxy = new Proxy(
    {
      current: currentValue,
    },
    {
      set(target, prop, newValue) {
        if (prop === 'current' && target.current !== newValue) {
          target.current = structuredClone(newValue);
          for (const fn of subscribers) fn();
        }
        return true;
      },
    },
  );

  const subscribe = (listener: () => void) => {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  };

  const getState = () => stateProxy.current;

  const setState = (newValue: T) => {
    stateProxy.current = newValue;
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
