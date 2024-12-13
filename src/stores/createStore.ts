export interface StateStore<T> {
  subscribe: (listener: () => void) => () => void;
  getCurrent: () => T;
  setValue: (newValue: T) => void;
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

  return {
    subscribe,
    getCurrent,
    setValue,
  };
};
