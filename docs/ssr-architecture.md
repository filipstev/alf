# Server-Side Rendering Architecture

**Alf's SSR implementation prioritizes consistency between development and production environments while leveraging Bun's unique capabilities.**

## 🎯 Architecture Philosophy

### **Core Principle: Universal Rendering**
Both development and production use the same rendering pipeline:
```
Server Renders → Client Hydrates → Client Navigation
```

### **Why SSR-First?**
1. **Consistency** - Same code path in dev and production
2. **Performance** - Faster initial page loads
3. **SEO** - Search engines get fully rendered HTML
4. **Framework Expectations** - Modern full-stack frameworks are SSR by default

## 🏗️ System Architecture

### **Request Flow**
```
Browser Request → Bun Server → Route Match → SSR Render → HTML Response
                                    ↓
Client receives HTML + Hydration Script → Framework takes over navigation
```

### **Key Components**

#### 1. **Server Renderer** (`src/ssr/server-renderer.ts`)
- Renders components to HTML strings
- Uses existing router and core modules
- Handles component lifecycle server-side

#### 2. **Client Hydrator** (`src/ssr/client-hydrator.ts`)
- Attaches to server-rendered DOM
- Preserves existing content
- Sets up reactivity and event listeners

#### 3. **Universal Router** (existing `src/router/`)
- Works identically on server and client
- Provides component loading abstraction

## 📝 Implementation Plan

### **Phase 1: Basic SSR Foundation**

#### **Step 1: Server-Side Component Rendering**
Create `src/ssr/server-renderer.ts`:
```typescript
// Render components to HTML strings on server
async function renderToString(component: Function): Promise<string>

// Render full page with framework setup
async function renderPage(route: RouteMatch): Promise<string>
```

#### **Step 2: Client Hydration System**
Create `src/ssr/client-hydrator.ts`:
```typescript
// Connect client framework to server-rendered DOM
function hydrate(element: Element): void

// Set up client-side navigation after hydration
function setupNavigation(): void
```

#### **Step 3: Update Development Server**
Modify `src/cli/dev.ts`:
- Remove hardcoded script approach
- Use server renderer for all routes
- Send hydration script to client
- Maintain hot reload functionality

### **Phase 2: Production Optimization** (Future)
- Bundle optimization
- Code splitting by routes
- Static generation for static routes
- Advanced caching strategies

## 🔧 Technical Implementation Details

### **Server Rendering Process**
1. **Route Resolution** - Use existing router to match URL to component
2. **Component Loading** - Dynamically import the route component
3. **Reactive Rendering** - Execute component function, capture reactive subscriptions
4. **HTML Generation** - Convert virtual DOM to HTML string
5. **Hydration Data** - Serialize reactive state for client

### **Client Hydration Process**
1. **DOM Connection** - Attach to existing server-rendered elements
2. **State Restoration** - Restore reactive state from serialized data
3. **Event Binding** - Set up click handlers and reactive effects
4. **Navigation Setup** - Initialize client-side routing for subsequent navigation

### **Consistency Guarantees**
- **Same Component Code** - Components work identically server and client
- **Same Router Logic** - Route matching works the same everywhere
- **Same Reactivity** - Signals behave consistently in both environments
- **Same JSX Runtime** - Virtual DOM creation works universally

## 📋 File Structure Changes

```
src/
├── ssr/                      # ← NEW: Server-side rendering
│   ├── server-renderer.ts    # Component → HTML string conversion
│   ├── client-hydrator.ts    # Client attachment to server DOM
│   ├── universal-loader.ts   # Component loading abstraction
│   └── index.ts             # SSR public API
├── cli/
│   └── dev.ts               # ← UPDATED: Use SSR instead of hardcoded scripts
```

## 🎯 Benefits of This Approach

### **Developer Experience**
- **No configuration** - SSR works automatically
- **Consistent behavior** - Dev and prod work the same way
- **Fast development** - Hot reload preserves SSR benefits
- **Debugging clarity** - Same rendering pipeline everywhere

### **Performance Benefits**
- **Faster initial load** - Server sends ready HTML
- **Better SEO** - Search engines get full content
- **Progressive enhancement** - Works without JS, better with JS
- **Efficient hydration** - Only connects to existing DOM, doesn't re-render

### **Architecture Benefits**
- **Uses existing code** - Router, reactivity, JSX runtime all work server-side
- **Scalable foundation** - Easy to optimize and extend
- **Framework-like** - Behaves like Next.js, SvelteKit, etc.
- **Build system ready** - Same architecture works for bundled production

---

## Next Steps
1. Implement basic server renderer
2. Create client hydration system
3. Update development server to use SSR
4. Test with existing example pages
5. Document hydration behavior and edge cases

This foundation will provide a clean, scalable SSR system that maintains consistency between all environments while leveraging our existing framework components.