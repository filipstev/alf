# Alf Framework - Quickstart Guide

**Get started with Alf - the Bun-first reactive JavaScript framework**

## 🚀 **Getting Started**

### Prerequisites

- **Bun** v1.0+ installed ([Install Bun](https://bun.sh/docs/installation))
- **TypeScript** knowledge (optional but recommended)

### Installation

Currently, Alf is in development. To try it out:

```bash
# Clone the repository
git clone https://github.com/your-username/alf
cd alf

# Install dependencies
bun install

# Run the development server
bun run dev
```

### Future Installation (Coming Soon)

```bash
# Create a new Alf project
bunx create-alf-app my-app

# Navigate to your project
cd my-app

# Start development server
bun run dev
```

## 📁 **Project Structure**

A typical Alf project follows this structure:

```
my-app/
├── pages/                 # File-system based routes
│   ├── index.tsx         # Home page (/)
│   ├── about.tsx         # About page (/about)
│   └── users/
│       ├── index.tsx     # Users list (/users)
│       └── [id].tsx      # User profile (/users/:id)
├── src/
│   └── components/       # Reusable components
│       ├── Header.tsx
│       └── Layout.tsx
├── public/               # Static assets
│   ├── style.css
│   └── assets/
├── package.json
└── tsconfig.json
```

## 🎯 **Core Concepts**

### 1. Signals (Reactive State)

Alf uses fine-grained reactivity with signals for optimal performance:

```tsx
import { signal, computed, effect } from 'alf/core';

function Counter() {
  // Create reactive state
  const count = signal(0);

  // Derived state
  const doubleCount = computed(() => count() * 2);

  // Side effects
  effect(() => {
    console.log(`Count changed to: ${count()}`);
  });

  return (
    <div>
      <p>Count: {count()}</p>
      <p>Double: {doubleCount()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### 2. File-System Routing

Routes are automatically generated from your `pages/` directory:

```tsx
// pages/index.tsx - Home page (/)
export default function HomePage() {
  return <h1>Welcome to Alf!</h1>;
}

// pages/about.tsx - About page (/about)
export default function AboutPage() {
  return <h1>About Us</h1>;
}

// pages/users/[id].tsx - Dynamic route (/users/:id)
import { useParams } from 'alf/router';

export default function UserPage() {
  const params = useParams();
  return <h1>User ID: {params.id}</h1>;
}
```

### 3. Navigation

Client-side navigation with the router:

```tsx
import { navigate, Link } from 'alf/router';

function Navigation() {
  return (
    <nav>
      {/* Declarative navigation */}
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>

      {/* Programmatic navigation */}
      <button onClick={() => navigate('/contact')}>
        Contact Us
      </button>
    </nav>
  );
}
```

## 🛠️ **Available Commands**

### Development

```bash
# Start development server with hot reloading
bun run dev

# Run tests
bun test

# Watch tests
bun test --watch
```

### Production

```bash
# Build for production
bun run build

# Start production server
bun run start

# Build with custom options
bun run build --sourcemap --outdir dist
```

## 📝 **Example Application**

Here's a complete example showing Alf's key features:

### 1. Layout Component

```tsx
// src/components/Layout.tsx
import { Header } from './Header';

interface LayoutProps {
  children: any;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4">
        {children}
      </main>
    </div>
  );
}
```

### 2. Interactive Counter Page

```tsx
// pages/counter.tsx
import { signal, computed } from 'alf/core';
import { Layout } from '../src/components/Layout';

export default function CounterPage() {
  const count = signal(0);
  const isEven = computed(() => count() % 2 === 0);

  return (
    <Layout>
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-8">
          Interactive Counter
        </h1>

        <div className="text-6xl font-bold mb-4">
          {count()}
        </div>

        <div className="text-lg mb-8">
          This number is {isEven() ? 'even' : 'odd'}
        </div>

        <div className="space-x-4">
          <button
            onClick={() => count.set(count() + 1)}
            className="bg-blue-500 text-white px-6 py-2 rounded"
          >
            Increment
          </button>

          <button
            onClick={() => count.set(count() - 1)}
            className="bg-red-500 text-white px-6 py-2 rounded"
          >
            Decrement
          </button>

          <button
            onClick={() => count.set(0)}
            className="bg-gray-500 text-white px-6 py-2 rounded"
          >
            Reset
          </button>
        </div>
      </div>
    </Layout>
  );
}
```

### 3. Dynamic Route Example

```tsx
// pages/users/[id].tsx
import { signal, computed } from 'alf/core';
import { useParams, navigate } from 'alf/router';
import { Layout } from '../../src/components/Layout';

export default function UserPage() {
  const params = useParams();
  const userId = computed(() => parseInt(params.id));

  // Mock user data
  const user = computed(() => ({
    id: userId(),
    name: `User ${userId()}`,
    email: `user${userId()}@example.com`
  }));

  return (
    <Layout>
      <div className="py-12">
        <button
          onClick={() => navigate('/users')}
          className="mb-6 text-blue-500 hover:text-blue-700"
        >
          ← Back to Users
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-4">
            {user().name}
          </h1>

          <div className="space-y-2">
            <p><strong>ID:</strong> {user().id}</p>
            <p><strong>Email:</strong> {user().email}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
```

## 🔧 **Configuration**

### TypeScript Setup

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "jsx": "react-jsx",
    "jsxImportSource": "alf/core"
  }
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "alf dev",
    "build": "alf build",
    "start": "alf start",
    "test": "bun test"
  },
  "dependencies": {
    "alf": "^1.0.0"
  }
}
```

## ⚡ **Performance Features**

### Built-in Optimizations

- **Fine-grained reactivity** - Only update what actually changed
- **Zero virtual DOM** - Direct DOM manipulation for better performance
- **Automatic code splitting** - Routes are split by default
- **Bun-native speed** - Leverages Bun's performance advantages
- **Hot reloading** - Instant feedback during development

### Bundle Analysis

```bash
# Build with bundle analysis
bun run build

# Output shows:
# 📊 Bundle Analysis:
# ==================
# Entry Points:
#   src/core/index.js - 8.2 KB
#   src/router/index.js - 4.1 KB
# 💾 Total bundle size: 73.9 KB
```

## 🚧 **Current Status & Roadmap**

### ✅ **Completed Features**

- **Core Reactivity System** - Signals, computed values, effects
- **Custom JSX Runtime** - Full JSX support with reactivity integration
- **File-System Router** - Next.js-style routing with dynamic parameters
- **CLI Tools** - Development server, build system, production server
- **Hot Reloading** - WebSocket-based hot module replacement
- **TypeScript Support** - Full TypeScript integration

### 🔄 **In Progress**

- **SSR Support** - Server-side rendering with hydration
- **Create App CLI** - `bunx create-alf-app` command
- **Plugin System** - Extensibility for custom functionality

### 📋 **Missing Features (Identified)**

1. **Signal API Completeness**
   - `signal.set()` and `signal.update()` methods need proper TypeScript definitions
   - Array and object mutation helpers

2. **Router Hook Implementation**
   - `useParams()` function needs implementation
   - `useQuery()` for query parameters
   - `useRouter()` for router instance access

3. **JSX Runtime Resolution**
   - TypeScript path resolution for jsx-runtime in projects
   - Proper module resolution configuration

4. **Component Lifecycle**
   - `onMount()` and `onCleanup()` hooks
   - Error boundaries

## 🐛 **Known Issues**

### TypeScript Configuration

Currently, JSX projects may have TypeScript resolution issues. Temporary workaround:

```tsx
// Use h() function directly for now
import { h, signal } from 'alf/core';

function Component() {
  const count = signal(0);

  return h('div', null,
    h('p', null, 'Count: ', count()),
    h('button', {
      onClick: () => count.set(count() + 1)
    }, 'Increment')
  );
}
```

### Signal Methods

If you encounter `Property 'set' does not exist`, the signal type definitions need updating:

```tsx
// Current workaround - cast to any
const count = signal(0);
(count as any).set(5);

// Or use update pattern
count.update(() => 5);
```

## 🤝 **Contributing**

Alf is open source and we welcome contributions! Here are the priority areas:

1. **Complete Signal API** - Implement missing methods and type definitions
2. **Router Hooks** - Implement `useParams`, `useQuery`, `useRouter`
3. **JSX Runtime** - Fix TypeScript path resolution
4. **Documentation** - Improve examples and guides
5. **Testing** - Add more comprehensive tests

### Development Setup

```bash
# Fork and clone the repo
git clone https://github.com/your-username/alf
cd alf

# Install dependencies
bun install

# Run tests
bun test

# Start development
bun run dev

# Make changes and submit a PR!
```

## 📚 **Learning Resources**

- **[Core Concepts](./reactivity.md)** - Deep dive into signals and reactivity
- **[Router Guide](./router.md)** - File-system routing and navigation
- **[CLI Documentation](./cli.md)** - Development and build tools
- **[API Reference](./api-reference.md)** - Complete API documentation
- **[Example Project](../examples/portfolio-website/)** - Full portfolio website example

## 💬 **Community & Support**

- **GitHub Issues** - Bug reports and feature requests
- **Discord** - Community chat and support
- **Twitter** - Updates and announcements

---

**Ready to build something amazing?** Start with `bun run dev` and let Alf's performance speak for itself! 🦞⚡