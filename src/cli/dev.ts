#!/usr/bin/env bun

import type { ServerWebSocket } from "bun";
import { watch } from "fs";
import { join, resolve, extname } from "path";
import { scanRoutes, matchRoute } from "../router/router";
import { existsSync } from "fs";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const CWD = process.cwd();

const clients = new Set<ServerWebSocket<unknown>>();
let routes: any[] = [];

// Initialize routes
function initializeRoutes() {
  const pagesDir = join(CWD, "pages");
  if (existsSync(pagesDir)) {
    routes = scanRoutes(pagesDir);
    console.log(`📋 Found ${routes.length} route(s)`);
  } else {
    console.warn(`⚠️  No pages directory found at ${pagesDir}`);
  }
}

function createDevServer(): BunServer {
  return Bun.serve({
    port: PORT,
    async fetch(request) {
      const url = new URL(request.url);

      try {
        // WebSocket for hot reload
        if (url.pathname === "/__alf_ws") {
          const success = server.upgrade(request);
          return success
            ? undefined
            : new Response("Upgrade failed", { status: 500 });
        }

        // Serve source files for development
        if (url.pathname.startsWith("/src/")) {
          return await serveSourceFile(url.pathname);
        }

        // Handle static files
        if (url.pathname.startsWith("/public/")) {
          return await serveStaticFile(url.pathname);
        }

        // Handle application routes
        return await handleAppRoute(url.pathname);
      } catch (error) {
        console.error("Server error:", error);
        return new Response(renderErrorPage(error), {
          status: 500,
          headers: { "Content-Type": "text/html" },
        });
      }
    },

    websocket: {
      open(ws) {
        clients.add(ws);
        console.log("🔌 Client connected for hot reload");
      },
      close(ws) {
        clients.delete(ws);
      },
      message(_ws, message) {
        // Handle client messages for debugging
        console.log("📨 Client message:", message);
      },
    },
  });
}

// Serve source files during development
async function serveSourceFile(pathname: string): Promise<Response> {
  const filePath = join(CWD, pathname);

  try {
    const file = Bun.file(filePath);
    const exists = await file.exists();

    if (!exists) {
      return new Response("File not found", { status: 404 });
    }

    const ext = extname(filePath);
    const contentType = getContentType(ext);

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return new Response("Error serving file", { status: 500 });
  }
}

// Serve static files
async function serveStaticFile(pathname: string): Promise<Response> {
  const filePath = join(CWD, pathname);

  try {
    const file = Bun.file(filePath);
    const exists = await file.exists();

    if (!exists) {
      return new Response("File not found", { status: 404 });
    }

    const ext = extname(filePath);
    const contentType = getContentType(ext);

    return new Response(file, {
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    return new Response("Error serving static file", { status: 500 });
  }
}

// Handle app routes using server-side rendering
async function handleAppRoute(pathname: string): Promise<Response> {
  const { renderPage } = await import('../ssr');

  // Match the route using our existing router
  const matchedRoute = matchRoute(pathname, routes);

  if (matchedRoute) {
    // Server-render the matched route
    const html = await renderPage(matchedRoute, {
      hotReload: true
    });

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } else {
    // Render 404 page
    return new Response(await render404Page(pathname), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }
}


// Render 404 page
async function render404Page(pathname: string) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>404 - Page Not Found</title>
    ${hotReloadScript()}
    <style>
      body { font-family: system-ui; padding: 2rem; text-align: center; }
      .error { color: #e74c3c; }
    </style>
</head>
<body>
    <div id="app">
      <h1 class="error">404 - Page Not Found</h1>
      <p>The page <code>${pathname}</code> could not be found.</p>
      <a href="/">← Back to Home</a>

      <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
        <h3>Available Routes:</h3>
        <ul style="list-style: none; padding: 0;">
          ${routes
            .map(
              (r: any) =>
                `<li><a href="${r.pattern === "/index" ? "/" : r.pattern}">${
                  r.pattern
                }</a></li>`
            )
            .join("")}
        </ul>
      </div>
    </div>
</body>
</html>`;
}

// Error page with overlay
function renderErrorPage(error: any) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Server Error - Alf</title>
    <style>
      body { font-family: 'SF Mono', Monaco, monospace; margin: 0; padding: 2rem; background: #1a1a1a; color: #fff; }
      .error { background: #2d1b1b; border-left: 4px solid #e74c3c; padding: 1rem; margin: 1rem 0; }
      .stack { background: #2a2a2a; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.9em; }
      pre { margin: 0; white-space: pre-wrap; }
      .reload { background: #3498db; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    </style>
    ${hotReloadScript()}
</head>
<body>
    <h1>🚨 Development Server Error</h1>
    <div class="error">
      <h2>${error.name || "Error"}</h2>
      <p>${error.message || "An unexpected error occurred"}</p>
    </div>
    ${
      error.stack
        ? `
    <div class="stack">
      <h3>Stack Trace:</h3>
      <pre>${error.stack}</pre>
    </div>
    `
        : ""
    }
    <button class="reload" onclick="window.location.reload()">Reload Page</button>
    <div style="margin-top: 2rem; padding: 1rem; background: #333; border-radius: 4px;">
      <p>💡 <strong>Tip:</strong> Fix the error in your code and the page will auto-reload.</p>
    </div>
</body>
</html>`;
}

// Hot reload WebSocket script
function hotReloadScript() {
  return `
    <script>
      (function() {
        let ws;
        let retryCount = 0;
        const maxRetries = 5;

        function connect() {
          ws = new WebSocket('ws://localhost:${PORT}/__alf_ws');

          ws.onopen = () => {
            console.log('🔥 Hot reload connected');
            retryCount = 0;
          };

          ws.onmessage = (event) => {
            const data = event.data;
            if (data === 'reload') {
              console.log('🔄 Reloading page...');
              window.location.reload();
            } else if (data.startsWith('error:')) {
              console.error('💥 Build error:', data.slice(6));
            }
          };

          ws.onclose = () => {
            if (retryCount < maxRetries) {
              console.log('🔌 Connection lost, retrying...');
              setTimeout(connect, 1000 * Math.pow(2, retryCount));
              retryCount++;
            }
          };

          ws.onerror = (error) => {
            console.warn('WebSocket error:', error);
          };
        }

        connect();
      })();
    </script>
  `;
}

// Error overlay script for client-side errors
function errorOverlayScript() {
  return `
    <script>
      window.addEventListener('error', function(event) {
        showErrorOverlay({
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        });
      });

      window.addEventListener('unhandledrejection', function(event) {
        showErrorOverlay({
          message: 'Unhandled Promise Rejection: ' + event.reason,
          stack: event.reason?.stack
        });
      });

      function showErrorOverlay(error) {
        const overlay = document.createElement('div');
        overlay.id = 'alf-error-overlay';
        overlay.innerHTML = \`
          <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; color: white; font-family: monospace; font-size: 14px; padding: 2rem; overflow: auto;">
            <div style="max-width: 800px; margin: 0 auto;">
              <h1 style="color: #e74c3c; margin: 0 0 1rem 0;">Runtime Error</h1>
              <div style="background: #2d1b1b; padding: 1rem; border-left: 4px solid #e74c3c; margin: 1rem 0;">
                <strong>\${error.message}</strong>
              </div>
              \${error.filename ? \`<p><strong>File:</strong> \${error.filename}:\${error.lineno}:\${error.colno}</p>\` : ''}
              \${error.stack ? \`
                <div style="background: #2a2a2a; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                  <h3>Stack Trace:</h3>
                  <pre style="margin: 0; white-space: pre-wrap;">\${error.stack}</pre>
                </div>
              \` : ''}
              <button onclick="document.getElementById('alf-error-overlay').remove()" style="background: #3498db; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                Close
              </button>
            </div>
          </div>
        \`;
        document.body.appendChild(overlay);
      }
    </script>
  `;
}

// Get content type for file extensions
function getContentType(ext: string): string {
  const types: Record<string, string> = {
    ".ts": "application/typescript",
    ".tsx": "application/typescript",
    ".js": "application/javascript",
    ".jsx": "application/javascript",
    ".json": "application/json",
    ".css": "text/css",
    ".html": "text/html",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
  };
  return types[ext] || "text/plain";
}

function setupFileWatcher() {
  const watchPaths = [resolve(CWD, "src"), resolve(CWD, "pages")].filter(
    existsSync
  );

  watchPaths.forEach((path) => {
    watch(path, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      console.log(`📁 File ${eventType}: ${filename}`);

      // Re-scan routes if pages directory changed
      if (path.endsWith("pages")) {
        initializeRoutes();
      }

      // Notify all connected clients to reload
      clients.forEach((client) => {
        try {
          client.send("reload");
        } catch (error) {
          console.warn("Failed to send reload to client:", error);
        }
      });
    });
  });

  console.log(`📁 Watching: ${watchPaths.join(", ")}`);
}

type BunServer = ReturnType<typeof Bun.serve>;

// Initialize and start server
initializeRoutes();
const server = createDevServer();
setupFileWatcher();

console.log(`🦞 Alf dev server running at http://localhost:${PORT}`);
console.log(`🔥 Hot reload enabled with WebSocket`);
console.log(`📋 Routes initialized: ${routes.length} route(s)`);

export {};
