#!/usr/bin/env bun

/**
 * Alf Production Server - Ultra-fast Bun.serve() for Production
 *
 * Serves the built application with optimal performance
 */

import { join, extname } from "path";
import { existsSync, statSync, readFileSync } from "fs";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = process.env.HOST || "localhost";
const CWD = process.cwd();
const BUILD_DIR = process.env.BUILD_DIR || join(CWD, "dist");

interface ServerOptions {
  port?: number;
  host?: string;
  buildDir?: string;
  compression?: boolean;
  cors?: boolean;
}

function createProductionServer(options: ServerOptions = {}) {
  const {
    port = PORT,
    host = HOST,
    buildDir = BUILD_DIR,
    compression = true
  } = options;

  // Validate build directory exists
  if (!existsSync(buildDir)) {
    console.error(`❌ Build directory not found: ${buildDir}`);
    console.log("💡 Run 'bun run build' first to create the production build");
    process.exit(1);
  }

  // Load manifest for build info
  loadManifest(buildDir);

  return Bun.serve({
    port,
    hostname: host,
    async fetch(request) {
      const url = new URL(request.url);
      const pathname = url.pathname;

      try {
        // Handle root and SPA routes
        if (pathname === "/" || isAppRoute(pathname)) {
          return await serveHTML(buildDir, pathname);
        }

        // Handle static assets
        if (await isStaticAsset(buildDir, pathname)) {
          return await serveStaticFile(buildDir, pathname, compression);
        }

        // Handle API routes (if any)
        if (pathname.startsWith("/api/")) {
          return await handleApiRoute(pathname, request);
        }

        // 404 for everything else
        return new Response("Not Found", { status: 404 });

      } catch (error) {
        console.error("Server error:", error);
        return new Response("Internal Server Error", {
          status: 500,
          headers: { "Content-Type": "text/plain" }
        });
      }
    },

    error(error) {
      console.error("Server error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  });
}

function loadManifest(buildDir: string) {
  try {
    const manifestPath = join(buildDir, "manifest.json");
    if (existsSync(manifestPath)) {
      const manifestContent = readFileSync(manifestPath, "utf-8");
      return JSON.parse(manifestContent);
    }
  } catch (error) {
    console.warn("⚠️  Could not load build manifest:", error);
  }
  return null;
}

async function serveHTML(buildDir: string, pathname: string): Promise<Response> {
  let htmlPath: string;

  if (pathname === "/") {
    htmlPath = join(buildDir, "index.html");
  } else {
    // Try route-specific HTML first, fallback to index.html for SPA
    const routeHtml = join(buildDir, pathname.slice(1), "index.html");
    htmlPath = existsSync(routeHtml) ? routeHtml : join(buildDir, "index.html");
  }

  if (!existsSync(htmlPath)) {
    return new Response("HTML file not found", { status: 404 });
  }

  const file = Bun.file(htmlPath);
  return new Response(file, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}

async function isStaticAsset(buildDir: string, pathname: string): Promise<boolean> {
  const filePath = join(buildDir, pathname.slice(1));

  try {
    const stat = statSync(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function serveStaticFile(buildDir: string, pathname: string, _compression: boolean): Promise<Response> {
  const filePath = join(buildDir, pathname.slice(1));

  if (!existsSync(filePath)) {
    return new Response("File not found", { status: 404 });
  }

  const file = Bun.file(filePath);
  const ext = extname(filePath);
  const contentType = getContentType(ext);

  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };

  // Set appropriate cache headers based on file type
  if (isHashedAsset(pathname)) {
    // Long-term cache for hashed assets
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  } else if (ext === ".html") {
    // No cache for HTML files
    headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
  } else {
    // Short-term cache for other assets
    headers["Cache-Control"] = "public, max-age=3600";
  }

  // Add security headers
  if (ext === ".html") {
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["X-XSS-Protection"] = "1; mode=block";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
  }

  return new Response(file, { headers });
}

function isAppRoute(pathname: string): boolean {
  // Consider it an app route if it doesn't have a file extension
  // and doesn't start with known static prefixes
  const staticPrefixes = ["/assets", "/chunks", "/static", "/favicon"];
  return !extname(pathname) && !staticPrefixes.some(prefix => pathname.startsWith(prefix));
}

function isHashedAsset(pathname: string): boolean {
  // Check if filename contains a hash (e.g., chunk-abc123.js)
  return /\.[a-f0-9]{6,}\./i.test(pathname);
}

async function handleApiRoute(pathname: string, request: Request): Promise<Response> {
  // Basic API route handler - can be extended
  return new Response(
    JSON.stringify({
      error: "API routes not implemented",
      path: pathname,
      method: request.method
    }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" }
    }
  );
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.zip': 'application/zip'
  };

  return types[ext.toLowerCase()] || 'application/octet-stream';
}

function showServerInfo(server: any, buildDir: string, manifest: any) {
  console.log("\n🦞 Alf Production Server");
  console.log("========================");
  console.log(`🌐 Server: http://${server.hostname}:${server.port}`);
  console.log(`📁 Serving: ${buildDir}`);

  if (manifest) {
    console.log(`🏗️  Built: ${manifest.buildTime}`);
    console.log(`📦 Files: ${manifest.outputs?.length || 0}`);
  }

  console.log("\n🚀 Server ready for production traffic!");
  console.log("Press Ctrl+C to stop\n");
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: ServerOptions = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--port':
    case '-p':
      options.port = parseInt(args[++i]);
      break;
    case '--host':
    case '-h':
      options.host = args[++i];
      break;
    case '--build-dir':
      options.buildDir = args[++i];
      break;
    case '--no-compression':
      options.compression = false;
      break;
    case '--cors':
      options.cors = true;
      break;
    case '--help':
      console.log(`
Alf Production Server

Usage: bun run start [options]

Options:
  -p, --port <port>        Port number (default: 3000)
  -h, --host <host>        Host address (default: localhost)
  --build-dir <dir>        Build directory (default: dist)
  --no-compression         Disable compression
  --cors                   Enable CORS
  --help                   Show this help message

Examples:
  bun run start
  bun run start -p 8080 -h 0.0.0.0
  bun run start --build-dir build --cors

Environment Variables:
  PORT                     Port number
  HOST                     Host address
  BUILD_DIR                Build directory
`);
      process.exit(0);
  }
}

// Start server
try {
  const server = createProductionServer(options);
  const manifest = loadManifest(options.buildDir || BUILD_DIR);

  showServerInfo(server, options.buildDir || BUILD_DIR, manifest);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.stop();
    process.exit(0);
  });

} catch (error) {
  console.error("Failed to start server:", error);
  process.exit(1);
}

export { createProductionServer };