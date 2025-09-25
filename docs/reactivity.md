# Reactivity System - Deep Dive

**Understanding Alf's Fine-Grained Reactivity**

The reactivity system is the beating heart of Alf. Instead of re-rendering entire component trees (like React), or using a virtual DOM differ, Alf tracks dependencies at a granular level and updates only the specific DOM nodes that need to change.

## 🎯 **Core Concept: Signals**

### What is a Signal?

A signal is a **reactive primitive** - a container for a value that can notify listeners when it changes. Think of it as a "smart variable" that other parts of your app can subscribe to.

```typescript
const count = signal(0);        // Create signal with initial value
console.log(count());           // Read value: 0
count(5);                      // Write value: 5
console.log(count.peek());     // Read without subscribing: 5
```

### Why Signals Over State?

**Traditional React approach:**
```javascript
// React - whole component re-renders when count changes
function Counter() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>; // Entire component function re-runs
}
```

**Alf signal approach:**
```typescript
// Alf - only the text node updates
function Counter() {
  const count = signal(0);
  return <div>{count}</div>; // Only the text node gets updated
}
```

## 🏗️ **Implementation Deep Dive**

Let's examine the signal implementation line by line:

### Signal Factory Function

```typescript
export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;                    // Private closure variable
  const listeners = new Set<Listener>();      // Track who's listening
```

**Why a closure?** The `value` is private and can only be accessed through the signal functions. This ensures controlled access and guarantees that all reads/writes go through our tracking system.

**Why a Set?** Sets provide O(1) insertion and deletion, and automatically handle duplicates. When the same effect subscribes multiple times, we only notify it once.

### Reading Values (Subscription)

```typescript
const read = () => {
  if (currentListener) {           // Are we inside an effect/computed?
    listeners.add(currentListener); // Subscribe current context to changes
  }
  return value;
};
```

**The Magic of `currentListener`:** This is a global variable that tracks the currently executing effect or computed value. When you call `count()` inside an effect, the signal automatically subscribes that effect to future changes.

**Automatic Dependency Tracking Example:**
```typescript
const name = signal("Alice");
const age = signal(25);

effect(() => {
  console.log(`${name()} is ${age()} years old`);
  // ↑ Both signals automatically track this effect as a listener
});

name("Bob");  // Console logs: "Bob is 25 years old"
age(30);      // Console logs: "Bob is 30 years old"
```

### Writing Values (Notification)

```typescript
const write = (newValue: T) => {
  if (value !== newValue) {              // Skip update if value unchanged
    value = newValue;
    listeners.forEach(listener => listener()); // Notify all subscribers
  }
  return value;
};
```

**Why check for equality?** This prevents infinite loops and unnecessary DOM updates. If you set a signal to the same value, nothing happens.

**Synchronous updates:** All listeners are notified immediately and synchronously. This ensures predictable update order and prevents timing bugs.

### The Signal Interface

```typescript
function accessor(newValue?: T): T {
  if (arguments.length === 0) {     // Called as getter: count()
    return read();
  }
  return write(newValue as T);      // Called as setter: count(5)
}

accessor.peek = peek;               // Non-reactive read
return accessor;
```

**Overloaded function pattern:** The same function works as both getter and setter based on arguments. This provides a clean API: `count()` reads, `count(5)` writes.

**Peek method:** Sometimes you need to read a value without subscribing to it. `peek()` lets you access the current value without creating a dependency.

## 🧮 **Computed Values**

Computed values are derived state that automatically updates when dependencies change:

```typescript
const firstName = signal("John");
const lastName = signal("Doe");
const fullName = computed(() => `${firstName()} ${lastName()}`);

console.log(fullName());  // "John Doe"
firstName("Jane");
console.log(fullName());  // "Jane Doe" - automatically updated!
```

### Computed Implementation

```typescript
export function computed<T>(fn: ComputedFn<T>): ComputedSignal<T> {
  let value: T;
  let isStale = true;                    // Lazy evaluation flag
  const listeners = new Set<Listener>(); // Who's listening to this computed
```

**Lazy evaluation:** Computed values aren't calculated until someone reads them. If no one is listening, no work is done.

### The Update Mechanism

```typescript
const update = () => {
  const prevListener = currentListener;      // Save current context
  currentListener = notifyListeners;        // Set this computed as context
  listenerStack.push(notifyListeners);      // Stack for nested computeds

  try {
    value = fn();                          // Run the computation
    isStale = false;                       // Mark as fresh
  } finally {
    listenerStack.pop();                   // Restore context
    currentListener = prevListener;
  }
};
```

**Context switching:** When we run the computed function, we temporarily set `currentListener` to this computed's notification function. Any signals read inside `fn()` will automatically subscribe to notify this computed when they change.

**Stack-based tracking:** The `listenerStack` handles nested computed values properly. If computed A depends on computed B, and computed B depends on signal C, changes to C correctly propagate through B to A.

### Staleness and Caching

```typescript
const read = () => {
  if (isStale) {        // Only recompute if dependencies changed
    update();
  }

  if (currentListener) { // Subscribe caller to this computed
    listeners.add(currentListener);
  }

  return value;
};
```

**Smart caching:** Computed values cache their result and only recalculate when a dependency changes. This prevents expensive computations from running unnecessarily.

## ⚡ **Effects**

Effects are the bridge between reactive state and side effects (DOM updates, network requests, etc.):

```typescript
const count = signal(0);

const dispose = effect(() => {
  document.title = `Count: ${count()}`;  // Updates document title
  return () => console.log("Cleanup!");  // Optional cleanup function
});
```

### Effect Implementation

```typescript
export function effect(fn: EffectFn): () => void {
  let cleanup: (() => void) | void;
  let isRunning = false;               // Prevent recursive effects
```

### The Execution Cycle

```typescript
const execute = () => {
  if (isRunning) return;              // Guard against recursion

  if (cleanup) {                      // Run previous cleanup
    cleanup();
    cleanup = undefined;
  }

  isRunning = true;
  const prevListener = currentListener;
  currentListener = execute;          // Subscribe to any signals read
  listenerStack.push(execute);

  try {
    cleanup = fn();                   // Run effect, save cleanup function
  } finally {
    listenerStack.pop();
    currentListener = prevListener;
    isRunning = false;
  }
};
```

**Cleanup handling:** Effects can return a cleanup function that runs before the next effect execution or when the effect is disposed. This is crucial for preventing memory leaks.

**Recursion prevention:** The `isRunning` flag prevents effects from triggering themselves, which could cause infinite loops.

## 🔄 **Batching**

Sometimes you want to make multiple signal updates without triggering intermediate effects:

```typescript
export function batch<T>(fn: () => T): T {
  const prevListener = currentListener;
  currentListener = null;              // Disable tracking temporarily

  try {
    return fn();                      // All signal updates are silent
  } finally {
    currentListener = prevListener;    // Re-enable tracking
  }
}
```

**Use case example:**
```typescript
const firstName = signal("John");
const lastName = signal("Doe");
const fullName = computed(() => `${firstName()} ${lastName()}`);

effect(() => console.log(fullName())); // Logs: "John Doe"

// Without batching - logs twice:
firstName("Jane");    // Logs: "Jane Doe"
lastName("Smith");    // Logs: "Jane Smith"

// With batching - logs once:
batch(() => {
  firstName("Alice");
  lastName("Johnson");
}); // Logs: "Alice Johnson" (only once)
```

## 🎯 **Why This Design?**

### Inspiration from SolidJS

SolidJS pioneered this fine-grained reactivity approach in the JavaScript ecosystem. Their key insight: **the component function only runs once**. After that, it's pure reactive primitives updating the DOM.

### Advantages over Virtual DOM

1. **Performance:** Only changed DOM nodes update, no diffing algorithm needed
2. **Predictability:** Updates happen synchronously and in dependency order
3. **Memory:** No virtual DOM tree to maintain in memory
4. **Bundle size:** Smaller runtime since no virtual DOM implementation needed

### Advantages over Traditional State

1. **Automatic dependency tracking:** No need to specify dependencies manually
2. **Fine-grained updates:** Individual DOM properties update, not entire components
3. **Composability:** Signals can derive from other signals naturally
4. **No stale closures:** Always read the current value, never a captured one

## 🧪 **Testing the Reactivity System**

Our test suite verifies all these concepts work correctly:

```typescript
test("signal basic functionality", () => {
  const count = signal(0);
  expect(count()).toBe(0);      // Reading works
  count(5);
  expect(count()).toBe(5);      // Writing works
  expect(count.peek()).toBe(5); // Peek works
});

test("computed signals", () => {
  const count = signal(2);
  const doubled = computed(() => count() * 2);
  expect(doubled()).toBe(4);    // Initial computation
  count(3);
  expect(doubled()).toBe(6);    // Automatic update
});
```

This reactivity system forms the foundation that makes Alf applications fast and predictable. Next, let's see how this integrates with JSX and DOM rendering!