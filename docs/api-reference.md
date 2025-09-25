# API Reference

**Complete API Documentation for Alf Framework**

This reference covers all public APIs available in the Alf framework, organized by module with practical examples and TypeScript signatures.

## 🎯 **Core Module (`alf/core`)**

### Signals

#### `signal<T>(initialValue: T): Signal<T>`

Creates a reactive signal that can be read and updated.

```typescript
import { signal } from 'alf/core';

const count = signal(0);

// Read value
console.log(count()); // 0

// Update value
count.set(1);
count.update(prev => prev + 1);

// Type signature
interface Signal<T> {
  (): T;                           // Read current value
  set(value: T): void;             // Set new value
  update(fn: (prev: T) => T): void; // Update with function
}
```

#### `computed<T>(fn: () => T): ComputedSignal<T>`

Creates a computed value that automatically updates when dependencies change.

```typescript
import { signal, computed } from 'alf/core';

const firstName = signal('John');
const lastName = signal('Doe');
const fullName = computed(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "John Doe"

firstName.set('Jane');
console.log(fullName()); // "Jane Doe"

// Type signature
interface ComputedSignal<T> {
  (): T;                          // Read computed value
  readonly isComputed: true;      // Type guard
}
```

#### `effect(fn: () => void | (() => void)): () => void`

Creates a side effect that runs when dependencies change.

```typescript
import { signal, effect } from 'alf/core';

const count = signal(0);

const cleanup = effect(() => {
  console.log(`Count is: ${count()}`);

  // Optional cleanup function
  return () => {
    console.log('Effect cleanup');
  };
});

// Manually dispose effect
cleanup();
```

#### `batch(fn: () => void): void`

Batches multiple signal updates to prevent unnecessary re-computations.

```typescript
import { signal, batch } from 'alf/core';

const a = signal(1);
const b = signal(2);
const sum = computed(() => a() + b());

batch(() => {
  a.set(10);
  b.set(20);
  // sum only computes once with final values
});
```

### Components

#### `h(tag, props?, ...children): VElement`

Creates virtual DOM elements (JSX alternative).

```typescript
import { h } from 'alf/core';

// Simple element
const div = h('div', { class: 'container' }, 'Hello World');

// With event handlers
const button = h('button', {
  onClick: () => console.log('clicked')
}, 'Click me');

// Component usage
const App = () => h('div', null,
  h('h1', null, 'My App'),
  h('p', null, 'Welcome!')
);
```

#### `Fragment(...children): VElement`

Groups multiple elements without a wrapper.

```typescript
import { Fragment } from 'alf/core';

const MyComponent = () => Fragment(
  h('h1', null, 'Title'),
  h('p', null, 'Content')
);

// Or with JSX
const MyComponent = () => (
  <>
    <h1>Title</h1>
    <p>Content</p>
  </>
);
```

### Rendering

#### `render(element: VElement, container: HTMLElement): () => void`

Renders a virtual element to the DOM.

```typescript
import { render, h } from 'alf/core';

const App = () => h('div', null, 'Hello World');
const cleanup = render(App(), document.getElementById('root')!);

// Cleanup when done
cleanup();
```

### Lifecycle

#### `onMount(fn: () => void | (() => void)): void`

Runs code when component mounts.

```typescript
import { onMount } from 'alf/core';

function MyComponent() {
  onMount(() => {
    console.log('Component mounted');

    // Optional cleanup
    return () => {
      console.log('Component unmounting');
    };
  });

  return h('div', null, 'My Component');
}
```

#### `onCleanup(fn: () => void): void`

Registers cleanup function for when component unmounts.

```typescript
import { onCleanup } from 'alf/core';

function MyComponent() {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);

  onCleanup(() => {
    clearInterval(timer);
  });

  return h('div', null, 'Timer running...');
}
```

## 🧭 **Router Module (`alf/router`)**

### Navigation

#### `navigate(path: string, options?: NavigationOptions): Promise<void>`

Navigate to a new route programmatically.

```typescript
import { navigate } from 'alf/router';

// Simple navigation
await navigate('/users/123');

// With options
await navigate('/dashboard', {
  replace: true,      // Replace history entry
  state: { userId: 123 },
  scroll: false       // Don't scroll to top
});

// Type signature
interface NavigationOptions {
  replace?: boolean;
  state?: any;
  scroll?: boolean;
}
```

#### `replace(path: string, options?: NavigationOptions): Promise<void>`

Replace current route without adding history entry.

```typescript
import { replace } from 'alf/router';

// Redirect after login
await replace('/dashboard');
```

### Route Information

#### `useParams(): Params`

Access current route parameters.

```typescript
import { useParams } from 'alf/router';

// For route /users/:id
function UserPage() {
  const params = useParams();

  return h('div', null, `User ID: ${params.id}`);
}

// Type signature
interface Params {
  [key: string]: string;
}
```

#### `useQuery(): Query`

Access current query parameters.

```typescript
import { useQuery } from 'alf/router';

// For URL /search?q=react&page=2
function SearchPage() {
  const query = useQuery();

  return h('div', null, `Searching: ${query.q}, Page: ${query.page}`);
}

// Type signature
interface Query {
  [key: string]: string | string[];
}
```

#### `useRouter(): Router`

Access router instance for programmatic control.

```typescript
import { useRouter } from 'alf/router';

function Navigation() {
  const router = useRouter();

  return h('div', null,
    h('button', { onClick: () => router.back() }, 'Back'),
    h('button', { onClick: () => router.forward() }, 'Forward'),
    h('span', null, `Current: ${router.currentRoute.path}`)
  );
}

// Type signature
interface Router {
  currentRoute: Route;
  back(): void;
  forward(): void;
  navigate(path: string, options?: NavigationOptions): Promise<void>;
  replace(path: string, options?: NavigationOptions): Promise<void>;
  preload(path: string): Promise<void>;
}
```

### Route Components

#### `Link(props: LinkProps): VElement`

Declarative navigation component.

```typescript
import { Link } from 'alf/router';

const Navigation = () => h('nav', null,
  Link({ href: '/' }, 'Home'),
  Link({ href: '/about', preload: true }, 'About'),
  Link({
    href: '/users/123',
    activeClass: 'active',
    replace: true
  }, 'User Profile')
);

// Type signature
interface LinkProps {
  href: string;
  preload?: boolean;
  replace?: boolean;
  activeClass?: string;
  className?: string;
  onClick?: (event: MouseEvent) => void;
  children?: any;
}
```

### Route Configuration

#### `createRouter(options?: RouterOptions): Router`

Create and configure router instance.

```typescript
import { createRouter } from 'alf/router';

const router = createRouter({
  baseUrl: '/',
  hashMode: false,
  caseSensitive: false,
  trailingSlash: false,
  preloadOnHover: true,
  scrollToTop: true
});

// Type signature
interface RouterOptions {
  baseUrl?: string;
  hashMode?: boolean;
  caseSensitive?: boolean;
  trailingSlash?: boolean;
  preloadOnHover?: boolean;
  scrollToTop?: boolean;
}
```

## 🎨 **JSX Runtime**

### JSX Transform Support

Alf supports both manual `h()` calls and automatic JSX transform:

```typescript
// Manual (classic runtime)
import { h } from 'alf/core';

const App = () => h('div', { className: 'app' },
  h('h1', null, 'Hello World')
);

// Automatic (new JSX transform)
/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment } from 'alf/core';

const App = () => (
  <div className="app">
    <h1>Hello World</h1>
  </div>
);

// Or with jsxImportSource
/** @jsxImportSource alf/core */
const App = () => (
  <div className="app">
    <h1>Hello World</h1>
  </div>
);
```

### TypeScript JSX Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "alf/core"
  }
}
```

## 🔧 **Utility Functions**

### Signal Utilities

#### `untrack<T>(fn: () => T): T`

Execute function without tracking dependencies.

```typescript
import { signal, computed, untrack } from 'alf/core';

const a = signal(1);
const b = signal(2);

const c = computed(() => {
  const aValue = a();
  const bValue = untrack(() => b()); // Won't track b
  return aValue + bValue;
});

// c only re-computes when 'a' changes, not 'b'
```

#### `isSignal(value: any): value is Signal<any>`

Type guard to check if value is a signal.

```typescript
import { signal, isSignal } from 'alf/core';

const count = signal(0);
const notSignal = 42;

console.log(isSignal(count));     // true
console.log(isSignal(notSignal)); // false
```

### DOM Utilities

#### `ref<T extends HTMLElement>(): Ref<T>`

Create a reference to a DOM element.

```typescript
import { ref, onMount } from 'alf/core';

function MyComponent() {
  const inputRef = ref<HTMLInputElement>();

  onMount(() => {
    inputRef.current?.focus();
  });

  return h('input', { ref: inputRef });
}

// Type signature
interface Ref<T> {
  current: T | null;
}
```

#### `portal(element: VElement, container: HTMLElement): VElement`

Render element in a different part of the DOM.

```typescript
import { portal } from 'alf/core';

function Modal({ children }) {
  return portal(
    h('div', { className: 'modal' }, children),
    document.body
  );
}
```

## 🎯 **Type Definitions**

### Core Types

```typescript
// Signal types
type Signal<T> = {
  (): T;
  set(value: T): void;
  update(fn: (prev: T) => T): void;
};

type ComputedSignal<T> = {
  (): T;
  readonly isComputed: true;
};

// Virtual DOM types
type VElement = {
  tag: string | Component;
  props: Record<string, any> | null;
  children: VElement[];
  key?: string | number;
};

type Component<P = {}> = (props: P) => VElement;

// Event types
interface EventHandler<T = Event> {
  (event: T): void;
}

interface KeyboardEventHandler extends EventHandler<KeyboardEvent> {}
interface MouseEventHandler extends EventHandler<MouseEvent> {}
interface InputEventHandler extends EventHandler<InputEvent> {}
```

### Router Types

```typescript
// Route types
interface Route {
  path: string;
  pattern: string;
  component: Component;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  meta?: RouteMeta;
}

interface RouteMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  [key: string]: any;
}

// Navigation types
interface NavigationGuard {
  (to: Route, from: Route): boolean | string | Promise<boolean | string>;
}
```

## 🚀 **Performance APIs**

### Lazy Loading

#### `lazy<P>(factory: () => Promise<{ default: Component<P> }>): Component<P>`

Create lazy-loaded component.

```typescript
import { lazy, Suspense } from 'alf/core';

const LazyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return h(Suspense, { fallback: h('div', null, 'Loading...') },
    h(LazyComponent)
  );
}
```

### Suspense

#### `Suspense(props: SuspenseProps): VElement`

Handle async component loading.

```typescript
import { Suspense } from 'alf/core';

function App() {
  return h(Suspense, {
    fallback: h('div', { className: 'loading' }, 'Loading...'),
    onError: (error) => console.error('Failed to load:', error)
  },
    h(LazyComponent)
  );
}

// Type signature
interface SuspenseProps {
  fallback: VElement;
  onError?: (error: Error) => void;
  children: VElement;
}
```

## 📚 **Example Usage Patterns**

### Counter Component

```typescript
import { signal, h } from 'alf/core';

function Counter() {
  const count = signal(0);

  return h('div', null,
    h('p', null, `Count: ${count()}`),
    h('button', {
      onClick: () => count.update(n => n + 1)
    }, '+'),
    h('button', {
      onClick: () => count.update(n => n - 1)
    }, '-')
  );
}
```

### Todo List

```typescript
import { signal, h } from 'alf/core';

function TodoApp() {
  const todos = signal([]);
  const newTodo = signal('');

  const addTodo = () => {
    if (newTodo().trim()) {
      todos.update(list => [...list, {
        id: Date.now(),
        text: newTodo(),
        completed: false
      }]);
      newTodo.set('');
    }
  };

  return h('div', null,
    h('input', {
      value: newTodo(),
      onInput: (e) => newTodo.set(e.target.value),
      onKeyPress: (e) => e.key === 'Enter' && addTodo()
    }),
    h('button', { onClick: addTodo }, 'Add'),
    h('ul', null,
      ...todos().map(todo =>
        h('li', { key: todo.id },
          h('label', null,
            h('input', {
              type: 'checkbox',
              checked: todo.completed,
              onChange: (e) => {
                todos.update(list =>
                  list.map(t => t.id === todo.id
                    ? { ...t, completed: e.target.checked }
                    : t
                  )
                );
              }
            }),
            todo.text
          )
        )
      )
    )
  );
}
```

---

This API reference covers all public interfaces in the Alf framework. For implementation details and advanced patterns, see the corresponding documentation files.