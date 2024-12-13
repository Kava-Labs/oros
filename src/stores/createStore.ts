export interface StateStore<T> {
  getCurrent: () => T;
  setValue: (newValue: T) => void;

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
          for (const listener of subscribers) listener();
        }
        return true;
      },
    },
  );

  const subscribe = (listener: () => void) => {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  };

  const getCurrent = () => stateProxy.current;

  const setValue = (newValue: T) => {
    stateProxy.current = newValue;
  };

  const getSubscriberCount = () => {
    return subscribers.size;
  };

  return {
    subscribe,
    getSubscriberCount,
    getCurrent,
    setValue,
  };
};
