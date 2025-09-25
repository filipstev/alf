/**
 * Alf Framework - Server-Side Renderer
 *
 * Renders components to HTML strings on the server using our existing
 * reactivity system and JSX runtime. This provides the foundation for
 * universal rendering between server and client.
 */

import { h, Fragment } from "../core/jsx";
import type { AlfElement, AlfNode } from "../core/types";
import type { MatchedRoute } from "../router/types";

/**
 * Renders a component function to an HTML string
 *
 * This function executes the component on the server, captures any reactive
 * subscriptions (but doesn't execute effects), and converts the virtual DOM
 * tree to an HTML string.
 */
export async function renderToString(
  component: Function,
  props: Record<string, any> = {}
): Promise<string> {
  try {
    // Execute the component function to get virtual DOM
    const vdom = component(props);

    // Convert virtual DOM to HTML string
    return vdomToHtml(vdom);
  } catch (error) {
    console.error("Error rendering component to string:", error);
    return `<div style="color: red; padding: 1rem; border: 1px solid red;">
      <h3>Server Render Error</h3>
      <pre>${error instanceof Error ? error.message : "Unknown error"}</pre>
    </div>`;
  }
}

/**
 * Renders a full page with the framework setup
 *
 * This is the main entry point for SSR. It takes a matched route,
 * loads the component, renders it to HTML, and wraps it in a complete
 * HTML document with hydration scripts.
 */
export async function renderPage(
  matchedRoute: MatchedRoute,
  options: {
    title?: string;
    hotReload?: boolean;
  } = {}
): Promise<string> {
  try {
    // Build absolute path for the route component
    const pagesDir = process.cwd() + "/pages";
    const absolutePath = `${pagesDir}/${matchedRoute.route.filePath}`;

    console.log("Loading component from:", absolutePath);

    // Load the route component
    const componentModule = await import(absolutePath);
    const Component = componentModule.default;

    if (!Component) {
      throw new Error(
        `Component at ${matchedRoute.route.filePath} does not have a default export`
      );
    }

    // Render component to HTML string
    const componentHtml = await renderToString(Component, matchedRoute.params);

    // Generate complete HTML page
    return generatePage({
      title: options.title || `Alf App - ${matchedRoute.route.pattern}`,
      content: componentHtml,
      matchedRoute,
      hotReload: options.hotReload || false,
    });
  } catch (error) {
    console.error("Error rendering page:", error);
    return generateErrorPage(matchedRoute, error);
  }
}

/**
 * Convert virtual DOM elements to HTML strings
 *
 * This is a recursive function that traverses the virtual DOM tree
 * and generates corresponding HTML. It handles elements, text nodes,
 * fragments, and nested structures.
 */
function vdomToHtml(vdom: AlfNode): string {
  console.log("==============================");
  if (vdom === null || vdom === undefined || typeof vdom === "boolean") {
    return "";
  }

  console.log("Rendering vdom node:", vdom, typeof vdom);

  if (typeof vdom === "string" || typeof vdom === "number") {
    return escapeHtml(String(vdom));
  }

  if (Array.isArray(vdom)) {
    return vdom.map(vdomToHtml).join("");
  }

  // Handle function components (cast to any since AlfNode doesn't include functions)
  if (typeof vdom === "function") {
    const result = (vdom as any)();
    return vdomToHtml(result);
  }

  // Handle AlfElement
  if (typeof vdom === "object" && vdom && "type" in vdom) {
    const element = vdom as AlfElement;

    // Handle Fragment
    if (element.type === Fragment) {
      return element.children.map(vdomToHtml).join("");
    }

    // Handle function components
    if (typeof element.type === "function") {
      const componentResult = element.type(element.props);
      return vdomToHtml(componentResult);
    }

    // Handle regular HTML elements
    if (typeof element.type === "string") {
      const tag = element.type;
      const props = element.props || {};
      const children = element.children || [];

      console.log(
        "Rendering tag:",
        tag,
        "with props:",
        props,
        "and children count:",
        children
      );

      // Generate attributes string
      const attrs = Object.entries(props || {})
        .filter(([key]) => key !== "children")
        .map(([key, value]) => {
          // Handle event handlers (skip in SSR)
          if (key.startsWith("on") && typeof value === "function") {
            return "";
          }

          // Handle boolean attributes
          if (typeof value === "boolean") {
            return value ? key : "";
          }

          // Handle style objects
          if (key === "style" && typeof value === "object") {
            const styleStr = Object.entries(value)
              .map(([prop, val]) => `${prop}: ${val}`)
              .join("; ");
            return `style="${escapeHtml(styleStr)}"`;
          }

          return `${key}="${escapeHtml(String(value))}"`;
        })
        .filter(Boolean)
        .join(" ");

      const attrsStr = attrs ? ` ${attrs}` : "";

      // Self-closing tags
      if (["img", "br", "hr", "input", "meta", "link"].includes(tag)) {
        return `<${tag}${attrsStr} />`;
      }

      // Regular tags with content
      const childrenHtml = children.map(vdomToHtml).join("");
      console.log(`Rendered <${tag}> with content:`, childrenHtml);
      return `<${tag}${attrsStr}>${childrenHtml}</${tag}>`;
    }
  }

  console.warn("Unknown vdom node type:", typeof vdom, vdom);
  return "";
}

/**
 * Generate complete HTML page with hydration setup
 */
function generatePage(options: {
  title: string;
  content: string;
  matchedRoute: MatchedRoute;
  hotReload: boolean;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(options.title)}</title>
    ${options.hotReload ? generateHotReloadScript() : ""}
</head>
<body>
    <div id="app">${options.content}</div>

    <script>
      // Make route data available to client
      window.__alfRoutes = ${JSON.stringify([options.matchedRoute.route])};
    </script>

    <script type="module">
      // Import Alf framework for client-side hydration
      import { hydrate } from '/src/ssr/client-hydrator.ts';

      // Hydrate the server-rendered content
      const appElement = document.getElementById('app');
      hydrate(appElement, {
        route: ${JSON.stringify(options.matchedRoute)},
        hotReload: ${options.hotReload}
      });
    </script>
</body>
</html>`;
}

/**
 * Generate error page when component fails to render
 */
function generateErrorPage(matchedRoute: MatchedRoute, error: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Server Error - Alf App</title>
    <style>
      body { font-family: system-ui; padding: 2rem; }
      .error { color: #e74c3c; background: #fdf2f2; padding: 1rem; border-radius: 4px; }
      pre { background: #f8f8f8; padding: 1rem; overflow: auto; }
    </style>
</head>
<body>
    <div id="app">
      <div class="error">
        <h1>🚨 Server Render Error</h1>
        <p>Failed to render component: <code>${
          matchedRoute.route.filePath
        }</code></p>
        <pre>${escapeHtml(
          error instanceof Error ? error.stack || error.message : String(error)
        )}</pre>
        <p><a href="/">← Back to Home</a></p>
      </div>
    </div>
</body>
</html>`;
}

/**
 * Generate hot reload script for development
 */
function generateHotReloadScript(): string {
  return `
    <script>
      // Development hot reload WebSocket connection
      const ws = new WebSocket('ws://localhost:3000/_hot-reload');
      ws.onmessage = (event) => {
        if (event.data === 'reload') {
          window.location.reload();
        }
      };
    </script>
  `;
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  const div = { innerHTML: "" } as any;
  div.textContent = text;
  return div.innerHTML
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
