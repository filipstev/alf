# Design Decisions

**Why Alf Was Built This Way - Deep Dive into Architectural Choices**

This document explains the reasoning behind every major design decision in Alf, providing context for contributors and users who want to understand the framework's philosophy.

## 🎯 **Why Bun-First?**

### Decision: Target Bun Exclusively

Instead of supporting multiple runtimes, Alf is built specifically for Bun.

**Reasoning:**

- **Performance Focus** - Bun's native APIs are significantly faster than Node.js equivalents
- **Zero Config** - Bun's built-in TypeScript, bundling, and testing eliminate tooling complexity
- **Modern Standards** - Bun implements latest web standards (WebStreams, fetch, etc.)
- **File System Speed** - Bun's file system APIs are 10x faster than Node.js
- **Single Runtime Optimization** - We can optimize for one target instead of the lowest common denominator

**Trade-offs Accepted:**

- ❌ Smaller ecosystem (compared to Node.js)
- ❌ Less production adoption (Bun is newer)
- ✅ Better performance and developer experience
- ✅ Future-proof architecture

## 🔄 **Why Fine-Grained Reactivity?**

### Decision: Signals Over Virtual DOM

We chose a signal-based reactivity system instead of React's virtual DOM approach.

**Reasoning:**

- **Surgical Updates** - Only changed DOM nodes update, not entire component trees
- **Predictable Performance** - O(1) updates regardless of app size
- **Memory Efficiency** - No virtual DOM tree to maintain
- **Simpler Mental Model** - Direct data-to-DOM relationships

**Comparison:**

```typescript
// React (Virtual DOM)
function Counter() {
  const [count, setCount] = useState(0);

  // Entire component re-renders on state change
  return <div>Count: {count}</div>;
}

// Alf (Signals)
function Counter() {
  const count = signal(0);

  // Only the text node updates
  return <div>Count: {count()}</div>;
}
```

**Trade-offs:**

- ❌ Different from React (learning curve)
- ❌ Smaller ecosystem of compatible libraries
- ✅ Better performance characteristics
- ✅ More predictable behavior

## 🗂️ **Why File-System Routing?**

### Decision: Next.js-Style Routing

We adopted file-system based routing instead of configuration-based routing.

**Reasoning:**

- **Discoverability** - Routes are self-documenting in the file structure
- **Convention Over Configuration** - Less boilerplate and configuration
- **Scalability** - Easy to organize routes as apps grow
- **Developer Experience** - IDE navigation matches route structure

**File Structure Maps to URLs:**

```
pages/
├── index.ts          → /
├── about.ts          → /about
├── users/
│   ├── index.ts      → /users
│   └── [id].ts       → /users/:id
└── blog/
    └── [...slug].ts  → /blog/*
```

**Alternative Considered:**

```typescript
// Configuration-based (rejected)
const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/users/:id', component: User }
];
```

**Trade-offs:**

- ❌ Less flexible than programmatic routing
- ❌ File structure constraints
- ✅ Better organization and discoverability
- ✅ Automatic code splitting

## 🧩 **Why Custom JSX Runtime?**

### Decision: Build Our Own JSX Implementation

Instead of using React's JSX or adapting existing solutions, we built a custom runtime.

**Reasoning:**

- **Reactivity Integration** - JSX elements can contain signals directly
- **Performance Optimization** - Skip unnecessary wrapper objects
- **Type Safety** - Better TypeScript integration
- **Control** - We control the entire rendering pipeline

**Our JSX vs React JSX:**

```typescript
// Alf JSX - signals work directly
function App() {
  const count = signal(0);
  return <div>Count: {count()}</div>; // count() updates automatically
}

// React JSX - would need hooks
function App() {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>; // Re-renders entire component
}
```

**Technical Benefits:**

- Direct signal subscription in JSX attributes
- Compile-time optimizations for static elements
- Smaller runtime overhead
- Better error messages

## 🔧 **Why Minimal API Surface?**

### Decision: Keep the Core API Small

We prioritized a minimal, focused API over feature completeness.

**Reasoning:**

- **Learning Curve** - Fewer concepts to master
- **Maintenance** - Smaller surface area to maintain and test
- **Composability** - Small primitives can be combined in many ways
- **Performance** - Less code means smaller bundles

**Core Primitives:**

```typescript
// Only 4 core reactivity primitives
import { signal, computed, effect, batch } from 'alf/core';

// Simple component model
function Component() {
  return <div>Hello</div>;
}
```

**Extensibility Through Composition:**

```typescript
// Build complex patterns from simple primitives
function useAsyncData<T>(fetcher: () => Promise<T>) {
  const data = signal<T | null>(null);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const fetch = async () => {
    batch(() => {
      loading.set(true);
      error.set(null);
    });

    try {
      const result = await fetcher();
      data.set(result);
    } catch (e) {
      error.set(e as Error);
    } finally {
      loading.set(false);
    }
  };

  return { data, loading, error, fetch };
}
```

## 🎨 **Why No CSS-in-JS by Default?**

### Decision: Keep Styling Agnostic

We don't include a built-in styling solution.

**Reasoning:**

- **Framework Size** - Keep the core framework small
- **Developer Choice** - Let developers choose their preferred styling approach
- **Ecosystem** - Work with existing CSS solutions
- **Performance** - Avoid runtime CSS processing overhead

**Supported Approaches:**

```typescript
// CSS Modules
import styles from './Component.module.css';
<div className={styles.container} />

// Tailwind CSS
<div className="bg-blue-500 text-white p-4" />

// CSS-in-JS (user choice)
import { css } from 'your-favorite-css-lib';
<div className={css`background: blue;`} />

// Plain CSS
<div className="my-component" />
```

**Future Consideration:**

We may add optional CSS-in-JS packages that integrate with our reactivity system:

```typescript
// Potential future addition
import { styled } from 'alf/styled';

const Button = styled.button`
  background: ${props => props.primary ? 'blue' : 'gray'};
  color: white;
`;
```

## 🚀 **Why Development Server in Core?**

### Decision: Bundle Development Server

Instead of requiring separate dev server packages, we include one in the framework.

**Reasoning:**

- **Zero Config** - Works immediately after installation
- **Bun Integration** - Leverages Bun.serve() for maximum performance
- **HMR Integration** - Hot reloading works seamlessly with our reactivity
- **Unified Experience** - Single package for complete development experience

**Benefits:**

```bash
# No additional setup needed
bun create alf my-app
cd my-app
bun run dev  # Just works!
```

**Comparison with Alternatives:**

```typescript
// Other frameworks require separate tools
npm install webpack webpack-dev-server  # Webpack
npm install vite                        # Vite
npm install parcel                      # Parcel

// Alf includes everything
bun install alf  # Dev server included
```

## 🧪 **Why Bun Test Integration?**

### Decision: Use Bun's Built-in Test Runner

We use Bun's test runner instead of Jest, Vitest, or other options.

**Reasoning:**

- **Speed** - Bun test is significantly faster than alternatives
- **Zero Config** - No test configuration needed
- **Native TypeScript** - Tests can use TypeScript directly
- **Consistency** - Same runtime for development and testing

**Performance Comparison:**

```bash
# Bun test (our choice)
bun test  # ~50ms for 100 tests

# Jest (common alternative)
jest      # ~2000ms for 100 tests

# Vitest (fast alternative)
vitest    # ~300ms for 100 tests
```

**Test Experience:**

```typescript
// tests/component.test.ts
import { test, expect } from 'bun:test';
import { signal, render } from 'alf/core';

test('signal updates component', () => {
  const count = signal(0);
  const element = <div>{count()}</div>;

  const container = document.createElement('div');
  render(element, container);

  expect(container.textContent).toBe('0');

  count.set(1);
  expect(container.textContent).toBe('1');
});
```

## 📦 **Why Monolithic vs Modular?**

### Decision: Single Package with Optional Add-ons

We ship a single core package instead of many small packages.

**Reasoning:**

- **Simplicity** - One dependency to manage
- **Version Coherence** - All parts work together
- **Bundle Size** - Tree-shaking removes unused code
- **Developer Experience** - Single import source

**Package Structure:**

```typescript
// Single package with multiple entry points
import { signal, computed } from 'alf/core';
import { Link, navigate } from 'alf/router';
import { createServer } from 'alf/server';

// Tree-shaking removes unused modules
import { signal } from 'alf/core';  // Only includes reactivity
```

**Optional Add-ons:**

```typescript
// Additional packages for specific needs
import { styled } from 'alf-styled';        // CSS-in-JS (future)
import { query } from 'alf-query';          // Data fetching (future)
import { forms } from 'alf-forms';          // Form handling (future)
```

## 🔮 **Future Design Considerations**

### Server-Side Rendering

**Current State:** Planned but not implemented

**Design Direction:**
- Leverage Bun's fast startup for SSR
- Stream rendering for better performance
- Hydration strategy that preserves signals

### State Management

**Current State:** Signals provide local state

**Design Direction:**
- Global state through signal composition
- Optional state management add-on
- DevTools integration

### Animation System

**Current State:** No built-in animations

**Design Direction:**
- Signal-driven animations
- Web Animations API integration
- Performance-first approach

---

These design decisions prioritize performance, developer experience, and maintainability. As the framework evolves, we'll continue to make choices that align with these core principles while adapting to community needs and web platform changes.