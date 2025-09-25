# Development Server

**Bun.serve() Powered Development Environment with WebSocket Hot Reloading**

Alf's development server leverages Bun's ultra-fast `Bun.serve()` API to provide instant startup times and WebSocket-based hot reloading for the best possible developer experience.

## 🎯 **Core Features**

### Lightning Fast Startup

- **Bun.serve()** - Native server implementation
- **Zero-config TypeScript** - No build step needed
- **Instant file watching** - Bun's native file system APIs
- **Sub-second restarts** - Server restarts in milliseconds

### Hot Reloading System

- **WebSocket-based** - Real-time bidirectional communication
- **Granular updates** - Only reload changed components
- **State preservation** - Maintain component state across reloads
- **Error overlay** - In-browser error display

## 🏗️ **Architecture**

### Server Implementation (`src/cli/dev.ts`)

```typescript
import { serve, file } from 'bun';
import { watch } from 'fs';
import { WebSocket } from 'ws';

const server = serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleApiRoute(req);
    }

    // Handle WebSocket upgrade for HMR
    if (url.pathname === '/hmr') {
      return upgradeWebSocket(req);
    }

    // Serve static files
    if (url.pathname.startsWith('/static/')) {
      return file(`./public${url.pathname}`);
    }

    // Handle SPA routes
    return handlePageRoute(req);
  },

  websocket: {
    message(ws, message) {
      handleHmrMessage(ws, message);
    },
    open(ws) {
      console.log('HMR client connected');
    },
    close(ws) {
      console.log('HMR client disconnected');
    }
  }
});

console.log(`🚀 Development server running at http://localhost:3000`);
```

### File Watching System

```typescript
// Advanced file watching with debouncing
class FileWatcher {
  private watchers = new Map<string, FSWatcher>();
  private debounceMap = new Map<string, NodeJS.Timeout>();

  watch(path: string, callback: (event: string, filename: string) => void) {
    const watcher = watch(path, { recursive: true }, (event, filename) => {
      if (!filename) return;

      // Debounce rapid file changes
      const key = `${path}:${filename}`;
      if (this.debounceMap.has(key)) {
        clearTimeout(this.debounceMap.get(key)!);
      }

      this.debounceMap.set(key, setTimeout(() => {
        callback(event, filename);
        this.debounceMap.delete(key);
      }, 50));
    });

    this.watchers.set(path, watcher);
  }

  unwatch(path: string) {
    const watcher = this.watchers.get(path);
    if (watcher) {
      watcher.close();
      this.watchers.delete(path);
    }
  }
}
```

### Hot Module Replacement (HMR)

```typescript
// HMR message types
interface HmrMessage {
  type: 'reload' | 'update' | 'error' | 'connected';
  payload?: any;
}

// Client-side HMR runtime
class HmrClient {
  private ws: WebSocket;
  private retryCount = 0;

  constructor() {
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket('ws://localhost:3000/hmr');

    this.ws.onopen = () => {
      console.log('🔥 HMR connected');
      this.retryCount = 0;
    };

    this.ws.onmessage = (event) => {
      const message: HmrMessage = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      console.log('🔥 HMR disconnected');
      this.retry();
    };
  }

  private handleMessage(message: HmrMessage) {
    switch (message.type) {
      case 'reload':
        window.location.reload();
        break;

      case 'update':
        this.handleComponentUpdate(message.payload);
        break;

      case 'error':
        this.showErrorOverlay(message.payload);
        break;
    }
  }

  private handleComponentUpdate(payload: any) {
    // Hot swap component without losing state
    const { componentPath, newModule } = payload;
    updateComponent(componentPath, newModule);
  }
}
```

## 🔧 **Configuration**

### Development Server Options

```typescript
// dev.config.ts
export default {
  port: 3000,
  host: 'localhost',
  open: true,                 // Auto-open browser
  hmr: {
    enabled: true,
    port: 3001,              // WebSocket port
    overlay: true            // Error overlay
  },
  proxy: {
    '/api': 'http://localhost:8080'
  },
  static: {
    directory: './public',
    maxAge: 3600            // Cache control
  },
  cors: {
    origin: '*',
    credentials: true
  }
};
```

### Environment Variables

```bash
# .env.development
NODE_ENV=development
PORT=3000
HMR_PORT=3001
OPEN_BROWSER=true
ENABLE_OVERLAY=true
LOG_LEVEL=info
```

## 🔄 **Hot Reloading Process**

### File Change Detection

1. **File Watcher** detects changes in source files
2. **Change Analysis** determines affected modules
3. **Dependency Graph** finds components to update
4. **Module Reloading** recompiles changed modules
5. **WebSocket Broadcast** notifies connected clients
6. **Component Update** hot-swaps components in browser

### State Preservation

```typescript
// Component state preservation during HMR
const componentStates = new Map();

export function preserveState(componentId: string, state: any) {
  componentStates.set(componentId, state);
}

export function restoreState(componentId: string) {
  return componentStates.get(componentId);
}

// Auto-preserve signals and computed values
export function createSignal<T>(initialValue: T, id?: string) {
  const preserved = id ? restoreState(id) : undefined;
  const signal = signal(preserved ?? initialValue);

  if (id) {
    // Preserve state on next tick
    queueMicrotask(() => {
      preserveState(id, signal());
    });
  }

  return signal;
}
```

## 🎨 **Error Overlay**

### In-Browser Error Display

```typescript
// Error overlay component
function ErrorOverlay({ error, stack }: { error: Error; stack: string }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      fontFamily: 'monospace',
      fontSize: '14px',
      padding: '20px',
      zIndex: 10000,
      overflow: 'auto'
    }}>
      <h1 style={{ color: '#ff6b6b' }}>Build Error</h1>
      <h2>{error.message}</h2>
      <pre style={{
        backgroundColor: '#2d2d2d',
        padding: '10px',
        borderRadius: '4px',
        overflow: 'auto'
      }}>
        {stack}
      </pre>
      <button onClick={() => window.location.reload()}>
        Reload Page
      </button>
    </div>
  );
}
```

### Syntax Error Handling

```typescript
// Enhanced error reporting
interface ParseError {
  message: string;
  file: string;
  line: number;
  column: number;
  source: string;
  suggestions?: string[];
}

function formatSyntaxError(error: ParseError): string {
  const lines = error.source.split('\n');
  const errorLine = lines[error.line - 1];
  const pointer = ' '.repeat(error.column - 1) + '^';

  return `
${error.file}:${error.line}:${error.column}

${error.message}

${error.line}: ${errorLine}
     ${pointer}

${error.suggestions?.map(s => `💡 ${s}`).join('\n') || ''}
  `;
}
```

## 🚀 **Performance Features**

### Request Caching

```typescript
// Intelligent caching for development
const cache = new Map<string, CachedResponse>();

interface CachedResponse {
  content: string;
  etag: string;
  lastModified: Date;
  dependencies: string[];
}

function handleCachedRequest(path: string, req: Request): Response | null {
  const cached = cache.get(path);
  if (!cached) return null;

  // Check if any dependencies changed
  const hasChanges = cached.dependencies.some(dep =>
    hasFileChanged(dep, cached.lastModified)
  );

  if (hasChanges) {
    cache.delete(path);
    return null;
  }

  // Return 304 if client has fresh version
  const ifNoneMatch = req.headers.get('if-none-match');
  if (ifNoneMatch === cached.etag) {
    return new Response(null, { status: 304 });
  }

  return new Response(cached.content, {
    headers: {
      'etag': cached.etag,
      'last-modified': cached.lastModified.toUTCString()
    }
  });
}
```

### Parallel Processing

```typescript
// Process multiple files in parallel using Bun's Worker API
import { Worker } from 'worker_threads';

class ParallelProcessor {
  private workers: Worker[] = [];
  private taskQueue: Task[] = [];

  constructor(workerCount = navigator.hardwareConcurrency) {
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker('./processor-worker.ts');
      this.workers.push(worker);
    }
  }

  async processFiles(files: string[]): Promise<ProcessedFile[]> {
    const chunks = chunkArray(files, this.workers.length);

    const promises = chunks.map((chunk, index) =>
      this.processChunk(chunk, this.workers[index])
    );

    const results = await Promise.all(promises);
    return results.flat();
  }
}
```

## 🧪 **Development Tools**

### Built-in Debugger

```typescript
// WebSocket-based debugging
interface DebugMessage {
  type: 'breakpoint' | 'variable' | 'stack';
  payload: any;
}

class DevTools {
  private ws: WebSocket;

  setBreakpoint(file: string, line: number) {
    this.send({
      type: 'breakpoint',
      payload: { file, line, action: 'set' }
    });
  }

  inspectVariable(name: string) {
    this.send({
      type: 'variable',
      payload: { name, action: 'inspect' }
    });
  }

  private send(message: DebugMessage) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
```

### Performance Monitoring

```typescript
// Built-in performance monitoring
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startTiming(label: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(value);
  }

  getStats(label: string) {
    const values = this.metrics.get(label) || [];
    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
}

// Usage in development
const monitor = new PerformanceMonitor();

const stopTiming = monitor.startTiming('component-render');
renderComponent();
stopTiming();
```

## 🎯 **Best Practices**

### Development Workflow

1. **Keep files organized** - Use clear directory structure
2. **Enable source maps** - Better debugging experience
3. **Use TypeScript** - Leverage Bun's native TS support
4. **Monitor performance** - Use built-in profiling tools
5. **Handle errors gracefully** - Implement proper error boundaries

### Production Readiness

- **Environment parity** - Keep dev/prod as similar as possible
- **Bundle optimization** - Tree-shake unused code
- **Asset optimization** - Compress images and static files
- **Error tracking** - Implement proper error reporting
- **Performance monitoring** - Track key metrics

---

The development server is designed to maximize developer productivity while maintaining the performance characteristics that make Bun special.