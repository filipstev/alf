# Router Architecture

**File-System Based Routing with Client-Side Navigation**

Alf's router provides Next.js-style file-system based routing with optimized client-side navigation, built specifically for Bun's fast file system APIs.

## 🎯 **Core Concepts**

### File-System Based Routes

Routes are automatically generated from your `pages/` directory structure:

```
pages/
├── index.ts          → /
├── about.ts          → /about
├── users/
│   ├── index.ts      → /users
│   ├── [id].ts       → /users/:id
│   └── profile.ts    → /users/profile
└── blog/
    ├── [slug].ts     → /blog/:slug
    └── [category]/
        └── [slug].ts → /blog/:category/:slug
```

### Dynamic Routes

- `[param].ts` - Single dynamic parameter
- `[...params].ts` - Catch-all routes
- `[[...params]].ts` - Optional catch-all

## 📁 **Implementation Details**

### Route Discovery (`src/router/router.ts`)

The router scans the file system at startup to build an optimized route tree:

```typescript
interface Route {
  path: string;           // Original file path
  pattern: string;        // Route pattern (/users/:id)
  component: Component;   // Loaded component
  params: string[];       // Parameter names ['id']
  isIndex: boolean;       // Is index route
  isDynamic: boolean;     // Has dynamic segments
}
```

### Route Matching Algorithm

1. **Exact Match** - Static routes first for maximum performance
2. **Dynamic Match** - Parameter routes with type validation
3. **Catch-all Match** - Fallback for unmatched routes

### Client-Side Navigation (`src/router/navigation.ts`)

```typescript
// Programmatic navigation
import { navigate, replace } from 'alf/router';

// Push new history entry
navigate('/users/123');

// Replace current entry
replace('/login');

// Navigate with state
navigate('/dashboard', { userId: 123 });
```

## 🔧 **Route Components**

### Page Component Structure

```typescript
// pages/users/[id].ts
import { signal, computed } from 'alf/core';
import { useParams } from 'alf/router';

export default function UserPage() {
  const params = useParams();
  const userId = computed(() => params.id);

  return (
    <div>
      <h1>User {userId()}</h1>
    </div>
  );
}

// Optional: Route metadata
export const meta = {
  title: 'User Profile',
  description: 'User profile page'
};
```

### Route Guards & Middleware

```typescript
// pages/admin/index.ts
export const guard = async (route, context) => {
  if (!context.user?.isAdmin) {
    return '/login';
  }
  return true;
};

export default function AdminDashboard() {
  return <div>Admin Dashboard</div>;
}
```

## 🚀 **Performance Optimizations**

### Route Pre-loading

```typescript
// Automatically preload routes on hover
<Link href="/users/123" preload>
  View User
</Link>

// Manual preloading
import { preloadRoute } from 'alf/router';
preloadRoute('/dashboard');
```

### Code Splitting

Routes are automatically code-split using Bun's native ES modules:

```typescript
// Automatic lazy loading
const UserPage = lazy(() => import('./pages/users/[id].ts'));
```

### Route Caching

- **Component Cache** - Loaded components cached in memory
- **Route Cache** - Parsed routes cached for instant matching
- **Parameter Cache** - Parsed parameters cached per route

## 🔄 **Navigation Lifecycle**

### Route Change Process

1. **Route Resolution** - Match URL to route pattern
2. **Guard Execution** - Run route guards and middleware
3. **Component Loading** - Load route component (if not cached)
4. **Parameter Extraction** - Extract and validate route parameters
5. **Component Rendering** - Render new component
6. **History Update** - Update browser history
7. **Cleanup** - Clean up previous route effects

### Navigation Events

```typescript
import { onNavigationStart, onNavigationEnd } from 'alf/router';

onNavigationStart((to, from) => {
  console.log(`Navigating from ${from.path} to ${to.path}`);
});

onNavigationEnd((route) => {
  console.log(`Navigation complete: ${route.path}`);
});
```

## 🎨 **Router Hooks**

### useParams()

Access route parameters:

```typescript
function ProductPage() {
  const params = useParams();

  return <div>Product ID: {params.id}</div>;
}
```

### useQuery()

Access query parameters:

```typescript
function SearchPage() {
  const query = useQuery();

  return <div>Search: {query.q}</div>;
}
```

### useRouter()

Access router instance:

```typescript
function Navigation() {
  const router = useRouter();

  const handleBack = () => router.back();
  const handleForward = () => router.forward();

  return (
    <div>
      <button onClick={handleBack}>Back</button>
      <button onClick={handleForward}>Forward</button>
    </div>
  );
}
```

## 🔧 **Configuration**

### Router Setup

```typescript
// src/router/index.ts
import { createRouter } from 'alf/router';

const router = createRouter({
  baseUrl: '/',
  hashMode: false,
  trailingSlash: false,
  caseSensitive: false,
  preloadOnHover: true,
  scrollToTop: true
});

export default router;
```

### Custom Route Patterns

```typescript
// Custom parameter validation
export const params = {
  id: /^\d+$/,           // Only numbers
  slug: /^[a-z0-9-]+$/   // Lowercase alphanumeric with dashes
};
```

## 🧪 **Testing Routes**

```typescript
// tests/router.test.ts
import { test, expect } from 'bun:test';
import { createRouter } from '../src/router';

test('should match dynamic routes', () => {
  const router = createRouter();
  const route = router.match('/users/123');

  expect(route.pattern).toBe('/users/:id');
  expect(route.params).toEqual({ id: '123' });
});

test('should handle navigation', async () => {
  const router = createRouter();
  await router.navigate('/about');

  expect(router.currentRoute.path).toBe('/about');
});
```

## 🎯 **Best Practices**

### Route Organization

- Use index files for default routes
- Group related routes in directories
- Keep dynamic parameters at the end of paths
- Use descriptive parameter names

### Performance Tips

- Enable route preloading for better UX
- Use route guards for authentication checks
- Implement proper error boundaries
- Cache frequently accessed routes

### SEO Considerations

- Provide proper meta tags for each route
- Use server-side rendering for critical routes
- Implement proper canonical URLs
- Handle 404s gracefully

---

The router is designed to be both powerful and intuitive, leveraging Bun's performance advantages while providing a familiar developer experience similar to Next.js routing.