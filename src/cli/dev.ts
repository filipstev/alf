#!/usr/bin/env bun

import type { ServerWebSocket } from "bun";
import { watch } from "fs";
import { join, resolve } from "path";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const CWD = process.cwd();

const clients = new Set<ServerWebSocket<unknown>>();

function createDevServer(): BunServer {
  return Bun.serve({
    port: PORT,
    async fetch(request) {
      const url = new URL(request.url);

      // WebSocket for hot reload
      if (url.pathname === "/__alf_ws") {
        const success = server.upgrade(request);
        return success
          ? undefined
          : new Response("Upgrade failed", { status: 500 });
      }

      // Serve static files and handle routes
      if (url.pathname === "/") {
        return new Response(await renderIndexPage(), {
          headers: { "Content-Type": "text/html" },
        });
      }

      // Handle other routes
      return new Response("404 Not Found", { status: 404 });
    },

    websocket: {
      open(ws) {
        clients.add(ws);
        console.log("🔌 Client connected for hot reload");
      },
      close(ws) {
        clients.delete(ws);
      },
      message() {
        // Handle client messages if needed
      },
    },
  });
}

async function renderIndexPage() {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Alf Development Server</title>
    <script>
      // Hot reload WebSocket connection
      const ws = new WebSocket('ws://localhost:${PORT}/__alf_ws');
      ws.onmessage = (event) => {
        if (event.data === 'reload') {
          window.location.reload();
        }
      };
    </script>
</head>
<body>
    <div id="app"></div>
    <script type="module">
      // This will eventually load the user's app
      import { render, h, signal } from '/src/core/index.ts';

      const App = () => {
        const count = signal(0);
        return h('div', null,
          h('h1', null, 'Alf Dev Server Running! 🦞'),
          h('p', null, 'Framework is ready for development.'),
          h('button', {
            onClick: () => count(count() + 1)
          }, 'Clicked: ', count, ' times')
        );
      };

      render(h(App), document.getElementById('app'));
    </script>
</body>
</html>`;
}

function setupFileWatcher() {
  // Watch src directory for changes
  const srcPath = resolve(CWD, "src");

  watch(srcPath, { recursive: true }, (eventType, filename) => {
    console.log(`📁 File changed: ${filename}`);

    // Notify all connected clients to reload
    clients.forEach((client) => {
      client.send("reload");
    });
  });
}

type BunServer = ReturnType<typeof Bun.serve>;

const server = createDevServer();
setupFileWatcher();

console.log(`🦞 Alf dev server running at http://localhost:${PORT}`);
console.log(`🔥 Hot reload enabled`);
console.log(`📁 Watching: ${join(CWD, "src")}`);

export {};
export {};
