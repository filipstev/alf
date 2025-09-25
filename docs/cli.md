# CLI Commands

**Complete Command Line Interface for Alf Framework**

Alf provides a comprehensive CLI built on Bun's native capabilities for development, building, and production deployment.

## 🚀 **Overview**

The Alf CLI consists of three main commands:

- **`bun run dev`** - Development server with hot reloading
- **`bun run build`** - Production build using Bun's native bundler
- **`bun run start`** - Production server with optimized serving

All commands are implemented using Bun's native APIs for maximum performance and zero external dependencies.

## 🛠️ **Development Command**

### `bun run dev`

Starts the development server with comprehensive tooling for an optimal developer experience.

```bash
# Start development server
bun run dev

# The server will start at http://localhost:3000
# WebSocket hot reload available at ws://localhost:3000/__alf_ws
```

#### Features

- **Instant Startup** - Server starts in <100ms using Bun.serve()
- **Hot Reloading** - WebSocket-based hot reload with automatic reconnection
- **Route Auto-discovery** - Automatically scans `pages/` directory for routes
- **Source File Serving** - Direct TypeScript module serving from `/src/`
- **Static File Handling** - Serves assets from `/public/` directory
- **Error Overlays** - In-browser error display with stack traces
- **Router Integration** - Real-time route updates and navigation
- **Multi-client Support** - Handle multiple browser windows simultaneously

#### Implementation Details

```typescript
// src/cli/dev.ts - Key implementation
const server = Bun.serve({
  port: 3000,
  async fetch(request) {
    const url = new URL(request.url);

    // WebSocket upgrade for hot reload
    if (url.pathname === "/__alf_ws") {
      return server.upgrade(request);
    }

    // Serve TypeScript modules directly
    if (url.pathname.startsWith("/src/")) {
      return await serveSourceFile(url.pathname);
    }

    // Handle application routes
    return await handleAppRoute(url.pathname);
  },

  websocket: {
    open(ws) {
      clients.add(ws);
      console.log("🔌 Client connected for hot reload");
    },
    message(_ws, message) {
      console.log("📨 Client message:", message);
    }
  }
});
```

#### File Watching

The dev server watches multiple directories and intelligently handles different types of changes:

```typescript
function setupFileWatcher() {
  const watchPaths = [
    resolve(CWD, "src"),    // Framework source files
    resolve(CWD, "pages")   // Application route files
  ].filter(existsSync);

  watchPaths.forEach(path => {
    watch(path, { recursive: true }, (eventType, filename) => {
      console.log(`📁 File ${eventType}: ${filename}`);

      // Re-scan routes if pages directory changed
      if (path.endsWith('pages')) {
        initializeRoutes();
      }

      // Notify all clients to reload
      clients.forEach(client => client.send("reload"));
    });
  });
}
```

## 📦 **Build Command**

### `bun run build [options]`

Creates an optimized production build using Bun's native bundler.

```bash
# Basic build
bun run build

# Custom output directory
bun run build --outdir dist

# Build with sourcemaps
bun run build --sourcemap

# Disable minification for debugging
bun run build --no-minify

# Build for different target
bun run build --target node

# Disable code splitting
bun run build --no-splitting
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--outdir <dir>` | Output directory | `dist` |
| `--no-minify` | Disable minification | `false` |
| `--sourcemap` | Generate sourcemaps | `false` |
| `--target <target>` | Build target (`browser`, `bun`, `node`) | `browser` |
| `--no-splitting` | Disable code splitting | `false` |
| `--help` | Show help message | - |

#### Build Process

The build command performs the following steps:

1. **Clean Build Directory** - Removes existing build artifacts
2. **Route Discovery** - Scans `pages/` directory for entry points
3. **Bundle with Bun.build()** - Uses Bun's native bundler for optimal performance
4. **HTML Generation** - Creates HTML files for routes and SPA fallback
5. **Static File Copy** - Copies assets from `public/` directory
6. **Manifest Generation** - Creates build manifest with metadata
7. **Bundle Analysis** - Shows detailed bundle size information

#### Implementation

```typescript
// src/cli/build.ts - Core build logic
async function buildApp(options: BuildOptions = {}) {
  console.log("🦞 Starting Alf production build...");

  // Clean and prepare build directory
  await cleanBuildDir(outdir);

  // Scan routes for entry points
  const routes = await generateRouteEntries();

  // Build with Bun's native bundler
  const buildResult = await Bun.build({
    entrypoints: [
      join(CWD, "src/core/index.ts"),
      join(CWD, "src/router/index.ts"),
      ...routes.map(r => r.filePath)
    ],
    outdir,
    minify,
    sourcemap,
    target,
    splitting,
    naming: {
      entry: '[dir]/[name].[ext]',
      chunk: 'chunks/[name]-[hash].[ext]',
      asset: 'assets/[name]-[hash].[ext]'
    },
    define: {
      'process.env.NODE_ENV': '"production"',
      'import.meta.env.DEV': 'false',
      'import.meta.env.PROD': 'true'
    }
  });

  // Generate HTML, copy static files, create manifest
  await generateHTML(routes, outdir);
  await copyStaticFiles(outdir);
  await generateManifest(buildResult, outdir);
}
```

#### Bundle Analysis

The build command provides detailed analysis of the generated bundle:

```bash
📊 Bundle Analysis:
==================

Entry Points:
  src/core/index.js - 8.2 KB
  src/router/index.js - 4.1 KB

Chunks:
  chunks/router-abc123.js - 12.3 KB
  chunks/vendor-def456.js - 45.7 KB

Assets:
  assets/logo-789.svg - 2.1 KB
  assets/favicon-012.ico - 1.5 KB

💾 Total bundle size: 73.9 KB
```

#### Static File Handling

The build process intelligently handles static files:

```typescript
async function copyStaticFiles(outdir: string) {
  if (!existsSync(PUBLIC_DIR)) return;

  const glob = new Bun.Glob("**/*");
  const publicFiles = await Array.fromAsync(glob.scan({
    cwd: PUBLIC_DIR,
    onlyFiles: true
  }));

  for (const file of publicFiles) {
    const srcPath = join(PUBLIC_DIR, file);
    const destPath = join(outdir, file);

    // Use Bun.write for optimal performance
    await Bun.write(destPath, Bun.file(srcPath));
  }

  console.log(`📂 Copied ${publicFiles.length} static files`);
}
```

## 🌐 **Start Command**

### `bun run start [options]`

Starts the production server to serve the built application.

```bash
# Start production server
bun run start

# Custom port and host
bun run start -p 8080 -h 0.0.0.0

# Custom build directory
bun run start --build-dir build

# Enable CORS
bun run start --cors

# Disable compression
bun run start --no-compression
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --port <port>` | Port number | `3000` |
| `-h, --host <host>` | Host address | `localhost` |
| `--build-dir <dir>` | Build directory | `dist` |
| `--no-compression` | Disable compression | `false` |
| `--cors` | Enable CORS | `false` |
| `--help` | Show help message | - |

#### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port number | `PORT=8080` |
| `HOST` | Host address | `HOST=0.0.0.0` |
| `BUILD_DIR` | Build directory | `BUILD_DIR=build` |

#### Production Server Features

- **Ultra-fast Serving** - Bun.serve() for optimal performance
- **Intelligent Caching** - Proper cache headers for different asset types
- **SPA Support** - Fallback routing for single-page applications
- **Static Asset Optimization** - Efficient serving of hashed assets
- **Security Headers** - Built-in security headers for HTML files
- **Error Handling** - Graceful error responses
- **Build Validation** - Ensures build directory exists before starting

#### Implementation

```typescript
// src/cli/start.ts - Production server
function createProductionServer(options: ServerOptions = {}) {
  // Validate build directory exists
  if (!existsSync(buildDir)) {
    console.error(`❌ Build directory not found: ${buildDir}`);
    console.log("💡 Run 'bun run build' first");
    process.exit(1);
  }

  return Bun.serve({
    port,
    hostname: host,
    async fetch(request) {
      const url = new URL(request.url);
      const pathname = url.pathname;

      try {
        // Handle SPA routes
        if (pathname === "/" || isAppRoute(pathname)) {
          return await serveHTML(buildDir, pathname);
        }

        // Handle static assets
        if (await isStaticAsset(buildDir, pathname)) {
          return await serveStaticFile(buildDir, pathname, compression);
        }

        return new Response("Not Found", { status: 404 });

      } catch (error) {
        console.error("Server error:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
    }
  });
}
```

#### Caching Strategy

The production server implements an intelligent caching strategy:

```typescript
async function serveStaticFile(buildDir: string, pathname: string): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": getContentType(ext),
  };

  // Long-term cache for hashed assets
  if (isHashedAsset(pathname)) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  }
  // No cache for HTML files
  else if (ext === ".html") {
    headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
  }
  // Short-term cache for other assets
  else {
    headers["Cache-Control"] = "public, max-age=3600";
  }

  // Security headers for HTML
  if (ext === ".html") {
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["X-XSS-Protection"] = "1; mode=block";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
  }

  return new Response(file, { headers });
}
```

#### Server Information Display

When starting, the production server displays comprehensive information:

```bash
🦞 Alf Production Server
========================
🌐 Server: http://localhost:3000
📁 Serving: /path/to/project/dist
🏗️  Built: 2024-01-15T10:30:00.000Z
📦 Files: 12

🚀 Server ready for production traffic!
Press Ctrl+C to stop
```

## 🔧 **CLI Architecture**

### Command Structure

Each CLI command is implemented as a standalone script in `src/cli/`:

```
src/cli/
├── dev.ts     # Development server
├── build.ts   # Production build
└── start.ts   # Production server
```

### Shared Utilities

Common functionality is shared across commands:

```typescript
// Content type detection
function getContentType(ext: string): string {
  const types: Record<string, string> = {
    '.ts': 'application/typescript',
    '.tsx': 'application/typescript',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html; charset=utf-8',
    '.json': 'application/json',
    // ... more types
  };
  return types[ext] || 'text/plain';
}

// File serving utilities
async function serveFile(filePath: string): Promise<Response> {
  const file = Bun.file(filePath);
  const exists = await file.exists();

  if (!exists) {
    return new Response("File not found", { status: 404 });
  }

  return new Response(file, {
    headers: { "Content-Type": getContentType(extname(filePath)) }
  });
}
```

### Error Handling

Consistent error handling across all commands:

```typescript
// Graceful error handling
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});
```

## 🎯 **Best Practices**

### Development Workflow

1. **Start with `bun run dev`** for active development
2. **Test builds regularly** with `bun run build`
3. **Verify production behavior** with `bun run start`
4. **Monitor bundle sizes** during development

### Production Deployment

1. **Build first**: `bun run build`
2. **Verify build**: Check `dist/` directory contents
3. **Start production server**: `bun run start`
4. **Configure environment**: Set `PORT`, `HOST` as needed

### Performance Tips

- Use `--target` option for optimal builds
- Enable `--sourcemap` for debugging production issues
- Monitor bundle analysis output for optimization opportunities
- Configure caching headers appropriately for your CDN

---

The Alf CLI provides a complete toolkit for modern web development, leveraging Bun's performance advantages throughout the entire development lifecycle.