/**
 * Alf Framework - Server-Side Renderer
 *
 * Pure server-side code for rendering components to HTML strings.
 * This module should never be imported on the client.
 */

import { h, Fragment } from '../core/jsx';
import type { AlfElement, AlfNode } from '../core/types';
import type { MatchedRoute } from '../router/types';

/**
 * Client manifest for resolving bundled paths in production
 */
interface ClientManifest {
  [filePath: string]: string;
}

/**
 * Renders a component function to an HTML string
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
    console.error('Error rendering component to string:', error);
    return generateErrorComponent(error);
  }
}

/**
 * Renders a full page with proper client bootstrapping
 */
export async function renderPage(
  matchedRoute: MatchedRoute,
  allRoutes: any[],
  options: {
    title?: string;
    hotReload?: boolean;
    clientManifest?: ClientManifest;
  } = {}
): Promise<string> {
  try {
    // Load the route component
    const Component = await loadServerComponent(matchedRoute.route.filePath);

    // Render component to HTML string
    const componentHtml = await renderToString(Component, matchedRoute.params);

    // Generate complete HTML page with client bootstrap
    return generatePage({
      title: options.title || `Alf App - ${matchedRoute.route.pattern}`,
      content: componentHtml,
      matchedRoute,
      allRoutes,
      hotReload: options.hotReload || false,
      clientManifest: options.clientManifest || {}
    });

  } catch (error) {
    console.error('Error rendering page:', error);
    return generateErrorPage(matchedRoute, error);
  }
}

/**
 * Load component on server using filesystem path
 */
async function loadServerComponent(filePath: string): Promise<Function> {
  const pagesDir = process.cwd() + '/pages';
  const absolutePath = `${pagesDir}/${filePath}`;

  console.log('Loading server component from:', absolutePath);

  const componentModule = await import(absolutePath);
  const Component = componentModule.default;

  if (!Component) {
    throw new Error(`Component at ${filePath} does not have a default export`);
  }

  return Component;
}

/**
 * Convert virtual DOM elements to HTML strings
 */
function vdomToHtml(vdom: AlfNode): string {
  if (vdom === null || vdom === undefined || typeof vdom === 'boolean') {
    return '';
  }

  if (typeof vdom === 'string' || typeof vdom === 'number') {
    return escapeHtml(String(vdom));
  }

  if (Array.isArray(vdom)) {
    return vdom.map(vdomToHtml).join('');
  }

  // Handle function components
  if (typeof vdom === 'function') {
    const result = (vdom as any)();
    return vdomToHtml(result);
  }

  // Handle AlfElement
  if (typeof vdom === 'object' && vdom && 'type' in vdom) {
    const element = vdom as AlfElement;

    // Handle Fragment
    if (element.type === Fragment) {
      return element.children.map(vdomToHtml).join('');
    }

    // Handle function components
    if (typeof element.type === 'function') {
      const componentResult = element.type(element.props);
      return vdomToHtml(componentResult);
    }

    // Handle regular HTML elements
    if (typeof element.type === 'string') {
      return renderHtmlElement(element);
    }
  }

  console.warn('Unknown vdom node type:', typeof vdom, vdom);
  return '';
}

/**
 * Render a regular HTML element with proper attribute handling
 */
function renderHtmlElement(element: AlfElement): string {
  const tag = element.type as string;
  const props = element.props || {};
  const children = element.children || [];

  // Generate attributes string with proper handling
  const attrs = Object.entries(props)
    .filter(([key]) => key !== 'children')
    .map(([key, value]) => formatAttribute(key, value))
    .filter(Boolean)
    .join(' ');

  const attrsStr = attrs ? ` ${attrs}` : '';

  // Self-closing tags
  if (['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tag)) {
    return `<${tag}${attrsStr} />`;
  }

  // Regular tags with content
  const childrenHtml = children.map(vdomToHtml).join('');
  return `<${tag}${attrsStr}>${childrenHtml}</${tag}>`;
}

/**
 * Format a single attribute for HTML output
 */
function formatAttribute(key: string, value: any): string {
  // Skip event handlers in SSR
  if (key.startsWith('on') && typeof value === 'function') {
    return '';
  }

  // Handle React-style attribute names
  if (key === 'className') key = 'class';
  if (key === 'htmlFor') key = 'for';

  // Handle boolean attributes
  if (typeof value === 'boolean') {
    return value ? key : '';
  }

  // Handle style objects
  if (key === 'style' && typeof value === 'object') {
    const styleStr = Object.entries(value)
      .map(([prop, val]) => `${toKebabCase(prop)}: ${val}`)
      .join('; ');
    return `style="${escapeHtml(styleStr)}"`;
  }

  return `${key}="${escapeHtml(String(value))}"`;
}

/**
 * Convert camelCase to kebab-case for CSS properties
 */
function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
}

/**
 * Generate complete HTML page with client bootstrap
 */
function generatePage(options: {
  title: string;
  content: string;
  matchedRoute: MatchedRoute;
  allRoutes: any[];
  hotReload: boolean;
  clientManifest: ClientManifest;
}): string {
  const clientData = {
    __alfRoutes: options.allRoutes,
    __alfClientManifest: options.clientManifest,
    __alfInitialRoute: options.matchedRoute,
    __alfHotReload: options.hotReload
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(options.title)}</title>
    ${options.hotReload ? generateHotReloadStyles() : ''}
</head>
<body>
    <div id="app">${options.content}</div>

    <script>
      // Inject server data for client hydration
      ${Object.entries(clientData)
        .map(([key, value]) => `window.${key} = ${JSON.stringify(value)};`)
        .join('\n      ')}
    </script>

    <script type="module" src="/_alf/client.js"></script>
</body>
</html>`;
}

/**
 * Generate error component HTML
 */
function generateErrorComponent(error: any): string {
  return `<div style="color: red; padding: 1rem; border: 1px solid red; border-radius: 4px; background: #fdf2f2;">
    <h3>Server Render Error</h3>
    <pre>${escapeHtml(error instanceof Error ? error.message : 'Unknown error')}</pre>
  </div>`;
}

/**
 * Generate error page when component fails to load
 */
function generateErrorPage(matchedRoute: MatchedRoute, error: any): string {
  // Don't expose full stack traces in production
  const errorMessage = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : (error instanceof Error ? error.stack || error.message : String(error));

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Server Error - Alf App</title>
    <style>
      body { font-family: system-ui; padding: 2rem; max-width: 800px; margin: 0 auto; }
      .error { color: #e74c3c; background: #fdf2f2; padding: 1rem; border-radius: 4px; border: 1px solid #e74c3c; }
      pre { background: #f8f8f8; padding: 1rem; overflow: auto; border-radius: 4px; }
      .back-link { margin-top: 1rem; }
      .back-link a { color: #3498db; text-decoration: none; }
    </style>
</head>
<body>
    <div id="app">
      <div class="error">
        <h1>🚨 Server Render Error</h1>
        <p>Failed to render component: <code>${escapeHtml(matchedRoute.route.filePath)}</code></p>
        <pre>${escapeHtml(errorMessage)}</pre>
        <div class="back-link">
          <a href="/">← Back to Home</a>
        </div>
      </div>
    </div>
</body>
</html>`;
}

/**
 * Generate hot reload styles for development
 */
function generateHotReloadStyles(): string {
  return `
    <style>
      /* Hot reload indicator styles */
      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
    </style>
  `;
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}