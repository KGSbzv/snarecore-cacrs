import { useState, useEffect } from 'react';

// Check for localStorage availability once.
let isLocalStorageAvailable: boolean;
try {
  const testKey = 'test';
  localStorage.setItem(testKey, testKey);
  localStorage.removeItem(testKey);
  isLocalStorageAvailable = true;
} catch (e) {
  isLocalStorageAvailable = false;
  if (typeof window !== 'undefined') {
      console.warn("LocalStorage is not available. State will not be persisted across sessions.");
  }
}

function useLocalStorageState<T>(key: string, initialValue: T | (() => T)) {
  const [state, setState] = useState<T>(() => {
    if (!isLocalStorageAvailable) {
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        return JSON.parse(storedValue);
      }
    } catch (error) {
      console.warn(`Could not parse stored value for key "${key}". Falling back to initial value.`, error);
    }
    return initialValue instanceof Function ? initialValue() : initialValue;
  });

  useEffect(() => {
    if (!isLocalStorageAvailable) {
      return; // Do nothing if localStorage is not available
    }

    try {
      if (state === null || state === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (error) {
      console.error(`Failed to save state for key "${key}" to localStorage.`, error);
    }
  }, [key, state]);

  return [state, setState] as const;
}

export default useLocalStorageState;