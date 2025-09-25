#!/usr/bin/env bun

/**
 * Alf Production Build Command - Leverages Bun's Native Bundler
 *
 * Uses Bun.build() for zero-config bundling with optimal performance
 */

import { join, resolve } from "path";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { scanRoutes } from "../router/router";

const CWD = process.cwd();
const BUILD_DIR = join(CWD, "dist");
const PUBLIC_DIR = join(CWD, "public");

interface BuildOptions {
  outdir?: string;
  minify?: boolean;
  sourcemap?: boolean;
  target?: "browser" | "bun" | "node";
  splitting?: boolean;
}

async function buildApp(options: BuildOptions = {}) {
  const {
    outdir = BUILD_DIR,
    minify = true,
    sourcemap = false,
    target = "browser",
    splitting = true
  } = options;

  console.log("🦞 Starting Alf production build...");
  console.log(`📦 Target: ${target}`);
  console.log(`📁 Output directory: ${outdir}`);

  try {
    // Clean build directory
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

    if (!buildResult.success) {
      console.error("❌ Build failed:");
      buildResult.logs.forEach(log => {
        console.error(log);
      });
      process.exit(1);
    }

    // Generate HTML files for routes
    await generateHTML(routes, outdir);

    // Copy static files
    await copyStaticFiles(outdir);

    // Generate manifest
    await generateManifest(buildResult, outdir);

    console.log("✅ Build completed successfully!");
    console.log(`📊 Generated ${buildResult.outputs.length} files`);
    console.log(`📁 Build directory: ${outdir}`);

    // Show bundle analysis
    await showBundleAnalysis(buildResult);

  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

async function cleanBuildDir(outdir: string) {
  console.log("🧹 Cleaning build directory...");

  if (existsSync(outdir)) {
    rmSync(outdir, { recursive: true, force: true });
  }

  mkdirSync(outdir, { recursive: true });
}

async function generateRouteEntries() {
  const pagesDir = join(CWD, "pages");

  if (!existsSync(pagesDir)) {
    console.warn("⚠️  No pages directory found, creating default route");
    return [{
      pattern: "/",
      filePath: join(CWD, "src/core/index.ts"),
      isIndex: true
    }];
  }

  const routes = scanRoutes(pagesDir);
  console.log(`📋 Found ${routes.length} route(s) to build`);

  return routes;
}

async function generateHTML(routes: any[], outdir: string) {
  console.log("🏗️  Generating HTML files...");

  // Generate index.html
  const indexHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alf App</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <meta name="generator" content="Alf Framework">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/src/core/index.js"></script>
    <script type="module">
      import { render, h } from '/src/core/index.js';
      import { createRouter } from '/src/router/index.js';

      // Initialize router and render app
      const router = createRouter();

      // This would normally load your main App component
      const App = () => h('div', null,
        h('h1', null, 'Alf Production App'),
        h('p', null, 'Your app is running in production mode!')
      );

      render(h(App), document.getElementById('app'));
    </script>
</body>
</html>`.trim();

  writeFileSync(join(outdir, "index.html"), indexHTML);

  // Generate route-specific HTML files if needed
  routes.forEach(route => {
    if (route.pattern !== "/" && !route.pattern.includes(":")) {
      const routePath = route.pattern.slice(1) || "index";
      const routeDir = join(outdir, routePath);

      if (!existsSync(routeDir)) {
        mkdirSync(routeDir, { recursive: true });
      }

      const routeHTML = indexHTML.replace(
        '<title>Alf App</title>',
        `<title>Alf App - ${route.pattern}</title>`
      );

      writeFileSync(join(routeDir, "index.html"), routeHTML);
    }
  });
}

async function copyStaticFiles(outdir: string) {
  if (!existsSync(PUBLIC_DIR)) {
    console.log("📁 No public directory found, skipping static files");
    return;
  }

  console.log("📂 Copying static files...");

  const glob = new Bun.Glob("**/*");
  const publicFiles = await Array.fromAsync(glob.scan({
    cwd: PUBLIC_DIR,
    onlyFiles: true
  }));

  for (const file of publicFiles) {
    const srcPath = join(PUBLIC_DIR, file);
    const destPath = join(outdir, file);
    const destDir = resolve(destPath, "..");

    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    await Bun.write(destPath, Bun.file(srcPath));
  }

  console.log(`📂 Copied ${publicFiles.length} static files`);
}

async function generateManifest(buildResult: any, outdir: string) {
  const manifest = {
    version: "1.0.0",
    buildTime: new Date().toISOString(),
    framework: "Alf",
    runtime: "Bun",
    outputs: buildResult.outputs.map((output: any) => ({
      path: output.path,
      kind: output.kind,
      size: output.size || 0
    })),
    entrypoints: buildResult.outputs
      .filter((output: any) => output.kind === "entry-point")
      .map((output: any) => output.path)
  };

  writeFileSync(
    join(outdir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log("📄 Generated build manifest");
}

async function showBundleAnalysis(buildResult: any) {
  console.log("\n📊 Bundle Analysis:");
  console.log("==================");

  const outputs = buildResult.outputs || [];
  let totalSize = 0;

  const categories = {
    'Entry Points': outputs.filter((o: any) => o.kind === 'entry-point'),
    'Chunks': outputs.filter((o: any) => o.kind === 'chunk'),
    'Assets': outputs.filter((o: any) => o.kind === 'asset')
  };

  Object.entries(categories).forEach(([category, files]: [string, any[]]) => {
    if (files.length > 0) {
      console.log(`\n${category}:`);
      files.forEach(file => {
        const size = file.size || 0;
        const sizeStr = formatBytes(size);
        const relativePath = file.path.replace(BUILD_DIR, '');
        console.log(`  ${relativePath} - ${sizeStr}`);
        totalSize += size;
      });
    }
  });

  console.log(`\n💾 Total bundle size: ${formatBytes(totalSize)}`);
  console.log("==================\n");
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: BuildOptions = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--outdir':
      options.outdir = args[++i];
      break;
    case '--no-minify':
      options.minify = false;
      break;
    case '--sourcemap':
      options.sourcemap = true;
      break;
    case '--target':
      options.target = args[++i];
      break;
    case '--no-splitting':
      options.splitting = false;
      break;
    case '--help':
      console.log(`
Alf Build Command

Usage: bun run build [options]

Options:
  --outdir <dir>     Output directory (default: dist)
  --no-minify        Disable minification
  --sourcemap        Generate sourcemaps
  --target <target>  Build target (default: browser)
  --no-splitting     Disable code splitting
  --help             Show this help message

Examples:
  bun run build
  bun run build --outdir build --sourcemap
  bun run build --no-minify --target node
`);
      process.exit(0);
  }
}

// Run build
buildApp(options).catch(error => {
  console.error("Build failed:", error);
  process.exit(1);
});

export { buildApp };