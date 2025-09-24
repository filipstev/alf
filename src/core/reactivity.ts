/**
 * Alf Framework - Reactivity System
 *
 * A fine-grained reactivity system inspired by SolidJS.
 * Provides signals, computed values, and effects with automatic dependency tracking.
 */

import type {
  Listener,
  Signal,
  ComputedSignal,
  ComputedFn,
  EffectFn
} from './types';

let currentListener: Listener | null = null;
const listenerStack: Listener[] = [];

/**
 * Creates a reactive signal - a primitive that holds a value and notifies listeners when it changes.
 *
 * @param initialValue - The initial value of the signal
 * @returns A signal function that can get or set the value
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * console.log(count()); // 0
 * count(5); // Set new value
 * console.log(count()); // 5
 * ```
 */
export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const listeners = new Set<Listener>();

  const read = () => {
    if (currentListener) {
      listeners.add(currentListener);
    }
    return value;
  };

  const write = (newValue: T) => {
    if (value !== newValue) {
      value = newValue;
      listeners.forEach(listener => listener());
    }
    return value;
  };

  const peek = () => value;

  function accessor(newValue?: T): T {
    if (arguments.length === 0) {
      return read();
    }
    return write(newValue as T);
  }

  accessor.peek = peek;
  return accessor;
}

/**
 * Creates a computed value that automatically updates when its dependencies change.
 *
 * @param fn - Function that returns the computed value
 * @returns A computed signal that tracks dependencies automatically
 *
 * @example
 * ```typescript
 * const count = signal(2);
 * const doubled = computed(() => count() * 2);
 * console.log(doubled()); // 4
 * count(3);
 * console.log(doubled()); // 6
 * ```
 */
export function computed<T>(fn: ComputedFn<T>): ComputedSignal<T> {
  let value: T;
  let isStale = true;
  const listeners = new Set<Listener>();

  const notifyListeners = () => {
    isStale = true;
    listeners.forEach(listener => listener());
  };

  const update = () => {
    const prevListener = currentListener;
    currentListener = notifyListeners;
    listenerStack.push(notifyListeners);

    try {
      value = fn();
      isStale = false;
    } finally {
      listenerStack.pop();
      currentListener = prevListener;
    }
  };

  const read = () => {
    if (isStale) {
      update();
    }

    if (currentListener) {
      listeners.add(currentListener);
    }

    return value;
  };

  const peek = () => {
    if (isStale) {
      update();
    }
    return value;
  };

  const accessor = (() => read()) as ComputedSignal<T>;
  accessor.peek = peek;
  return accessor;
}

/**
 * Creates an effect that runs when its dependencies change.
 *
 * @param fn - Function to run when dependencies change. Can return a cleanup function.
 * @returns Cleanup function to dispose the effect
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * const dispose = effect(() => {
 *   console.log('Count is:', count());
 *   return () => console.log('Effect cleanup');
 * });
 *
 * count(1); // Logs: "Count is: 1"
 * dispose(); // Logs: "Effect cleanup"
 * ```
 */
export function effect(fn: EffectFn): () => void {
  let cleanup: (() => void) | void;
  let isRunning = false;

  const execute = () => {
    if (isRunning) return;

    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }

    isRunning = true;
    const prevListener = currentListener;
    currentListener = execute;
    listenerStack.push(execute);

    try {
      cleanup = fn();
    } finally {
      listenerStack.pop();
      currentListener = prevListener;
      isRunning = false;
    }
  };

  execute();

  return () => {
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }
  };
}

/**
 * Batches multiple signal updates into a single update cycle.
 * Prevents intermediate re-computations during bulk updates.
 *
 * @param fn - Function containing signal updates
 * @returns The return value of the function
 *
 * @example
 * ```typescript
 * const a = signal(1);
 * const b = signal(2);
 * const sum = computed(() => a() + b());
 *
 * batch(() => {
 *   a(10);
 *   b(20);
 * }); // sum only recalculates once, not twice
 * ```
 */
export function batch<T>(fn: () => T): T {
  const prevListener = currentListener;
  currentListener = null;

  try {
    return fn();
  } finally {
    currentListener = prevListener;
  }
}