# Alf Framework Documentation

**A reactive JavaScript framework built on Bun - Deep Dive & Architecture Guide**

Alf is a modern, lightweight JavaScript framework that leverages Bun's ecosystem to provide fast, reactive web applications with file-system based routing. This documentation provides a comprehensive understanding of every design decision, implementation detail, and architectural choice.

## 🎯 **Framework Philosophy**

### Bun-First Approach

Unlike other frameworks that target Node.js with Bun as an afterthought, Alf is designed **specifically** for Bun's capabilities:

- **Native file system APIs** for blazing-fast route discovery
- **Built-in test runner** eliminating external dependencies
- **Bun.serve()** for ultra-fast development and production servers
- **Zero-config TypeScript** leveraging Bun's native TS support
- **WebSocket integration** for real-time features without extra libraries

### Inspired by the Best

- **SolidJS**: Fine-grained reactivity system with signals and effects
- **Next.js**: File-system based routing that scales naturally
- **Svelte**: Minimal runtime overhead and compile-time optimizations
- **Fresh**: Bun-first approach to modern web development

## 📁 **Project Structure**

```
alf/
├── docs/                    # Comprehensive documentation
├── src/
│   ├── core/               # Reactivity & rendering engine
│   │   ├── types.ts        # Core type definitions
│   │   ├── reactivity.ts   # Signal-based reactivity system
│   │   ├── jsx.ts          # JSX transformation runtime
│   │   ├── render.ts       # DOM rendering engine
│   │   ├── jsx-runtime.ts  # Auto-JSX transform support
│   │   └── index.ts        # Public API exports
│   ├── router/             # File-system based routing
│   │   ├── types.ts        # Router type definitions
│   │   ├── router.ts       # Core route matching logic
│   │   ├── navigation.ts   # Client-side navigation
│   │   └── index.ts        # Router public API
│   ├── cli/                # Development tooling
│   │   ├── dev.ts          # Development server
│   │   ├── build.ts        # Production build (TBD)
│   │   └── start.ts        # Production server (TBD)
│   ├── ssr/                # Server-side rendering (TBD)
│   └── utils/              # Utility functions (TBD)
├── tests/                  # Comprehensive test suite
└── examples/               # Example applications
```

## 🏗️ **Architecture Overview**

### 1. Reactivity System (`src/core/reactivity.ts`)

The heart of Alf's performance advantage. Instead of virtual DOM diffing, we use **fine-grained reactivity** where only the exact DOM nodes that depend on changed data get updated.

### 2. JSX Runtime (`src/core/jsx.ts` + `jsx-runtime.ts`)

Custom JSX transformation that integrates seamlessly with our reactivity system, supporting both manual `h()` calls and automatic JSX transform.

### 3. Rendering Engine (`src/core/render.ts`)

Converts virtual elements to real DOM while setting up reactive subscriptions for automatic updates.

### 4. File-System Router (`src/router/`)

Next.js-style routing that scans your `pages/` directory at build time and creates optimal route matching at runtime.

### 5. Development Server (`src/cli/dev.ts`)

Bun.serve()-powered development environment with WebSocket-based hot reloading.

## 📚 **Deep Dive Documentation**

1. **[Reactivity System](./reactivity.md)** - Signals, computed values, and effects
2. **[JSX Runtime](./jsx-runtime.md)** - Virtual DOM and component system
3. **[Rendering Engine](./rendering.md)** - DOM manipulation and lifecycle
4. **[Router Architecture](./router.md)** - File-system routing and navigation
5. **[Development Server](./dev-server.md)** - Hot reloading and development experience
6. **[API Reference](./api-reference.md)** - Complete API documentation
7. **[Design Decisions](./design-decisions.md)** - Why we made specific choices
8. **[Performance Guide](./performance.md)** - Optimization strategies

## 🚀 **Quick Start for Contributors**

```bash
# Clone and setup
git clone <repository>
cd alf
bun install

# Run tests
bun test

# Start development server
bun run dev

# View documentation
open docs/README.md
```

## 🎓 **Learning Path**

1. **Start with [Reactivity System](./reactivity.md)** to understand the core concept
2. **Read [JSX Runtime](./jsx-runtime.md)** to see how components work
3. **Explore [Router Architecture](./router.md)** for routing concepts
4. **Check [API Reference](./api-reference.md)** for practical usage
5. **Review [Design Decisions](./design-decisions.md)** for the "why" behind choices

---

_This documentation is designed to be educational - every line of complex code is explained with the reasoning behind implementation choices._
