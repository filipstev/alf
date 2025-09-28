/**
 * Alf Framework - Client-Side Hydration
 *
 * Pure client-side code for connecting to server-rendered DOM.
 * This module should never be imported on the server.
 */

import { render, h } from '../core';
import { matchRoute } from '../router';
import type { MatchedRoute } from '../router/types';

/**
 * Client manifest for resolving bundled module paths
 */
interface ClientManifest {
  [filePath: string]: string;
}

/**
 * Global client state injected by server
 */
interface ClientGlobals {
  __alfRoutes: any[];
  __alfClientManifest: ClientManifest;
  __alfInitialRoute: MatchedRoute;
  __alfHotReload: boolean;
}

declare global {
  interface Window extends ClientGlobals {}
}

/**
 * Initialize the client-side framework
 */
export async function initializeClient(): Promise<void> {
  console.log('🦞 Alf Framework - Client initialization');

  // Prevent double initialization
  if ((window as any).__alfInitialized) {
    console.warn('Alf client already initialized');
    return;
  }
  (window as any).__alfInitialized = true;

  try {
    // Get injected server data
    const routes = window.__alfRoutes || [];
    const manifest = window.__alfClientManifest || {};
    const initialRoute = window.__alfInitialRoute;
    const hotReload = window.__alfHotReload || false;

    console.log('Available routes:', routes.length);
    console.log('Client manifest:', Object.keys(manifest).length, 'entries');

    // Set up hot reload if enabled
    if (hotReload) {
      setupHotReload();
    }

    // Initialize the router
    const router = new ClientRouter(routes, manifest);

    // Hydrate the initial route
    await router.hydrateInitialRoute(initialRoute);

    // Make router available globally for debugging
    (window as any).__alfRouter = router;

  } catch (error) {
    console.error('❌ Client initialization failed:', error);
    showClientError('Failed to initialize Alf framework', error);
  }
}

/**
 * Client-side router with proper bundling support
 */
class ClientRouter {
  private routes: any[];
  private manifest: ClientManifest;
  private appElement: Element;

  constructor(routes: any[], manifest: ClientManifest) {
    this.routes = routes;
    this.manifest = manifest;
    this.appElement = document.getElementById('app')!;

    if (!this.appElement) {
      throw new Error('No #app element found for hydration');
    }

    this.setupNavigationListeners();
  }

  /**
   * Hydrate the initial server-rendered route
   */
  async hydrateInitialRoute(matchedRoute: MatchedRoute): Promise<void> {
    console.log('🔄 Hydrating initial route:', matchedRoute.route.pattern);

    try {
      // Load component using manifest
      const Component = await this.loadComponent(matchedRoute.route.filePath);

      // Progressive enhancement: replace server HTML with interactive version
      render(h(Component, matchedRoute.params), this.appElement);

      console.log('✅ Initial hydration complete');

    } catch (error) {
      console.error('❌ Initial hydration failed:', error);
      this.renderError(matchedRoute.route.pattern, error);
    }
  }

  /**
   * Load a component using the client manifest
   */
  private async loadComponent(filePath: string): Promise<Function> {
    // Use manifest to resolve bundled path
    const bundledPath = this.manifest[filePath];

    if (!bundledPath) {
      // Fallback to development path
      const devPath = `/pages/${filePath}`;
      console.warn(`No manifest entry for ${filePath}, using dev path:`, devPath);

      const module = await import(devPath);
      return module.default;
    }

    console.log(`Loading bundled component: ${filePath} → ${bundledPath}`);
    const module = await import(bundledPath);
    return module.default;
  }

  /**
   * Set up navigation event listeners with proper guards
   */
  private setupNavigationListeners(): void {
    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this.handleNavigation(window.location.pathname, false);
    });

    // Handle link clicks with comprehensive guards
    document.addEventListener('click', (event) => {
      this.handleLinkClick(event);
    });
  }

  /**
   * Handle link clicks with proper modifier key and attribute checks
   */
  private handleLinkClick(event: MouseEvent): void {
    // Don't interfere with modified clicks
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    // Find the closest anchor element
    const anchor = (event.target as Element).closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('/')) return;

    // Respect various opt-out attributes
    if (anchor.target && anchor.target !== '_self') return;
    if (anchor.hasAttribute('download')) return;
    if (anchor.rel === 'external') return;
    if (anchor.dataset.noRouter != null) return;

    // Prevent default and handle client-side
    event.preventDefault();
    this.navigate(href);
  }

  /**
   * Navigate to a new route
   */
  public navigate(path: string): void {
    history.pushState({}, '', path);
    this.handleNavigation(path, true);
  }

  /**
   * Handle navigation to a new route
   */
  private async handleNavigation(pathname: string, isPushNavigation: boolean): Promise<void> {
    console.log('🧭 Navigating to:', pathname);

    try {
      // Match the route
      const matchedRoute = matchRoute(pathname, this.routes);

      if (!matchedRoute) {
        this.render404(pathname);
        return;
      }

      // Update page title
      document.title = `Alf App - ${matchedRoute.route.pattern}`;

      // Scroll management
      if (isPushNavigation) {
        window.scrollTo(0, 0);
      }
      // For popstate, browser handles scroll restoration

      // Load and render component
      const Component = await this.loadComponent(matchedRoute.route.filePath);
      render(h(Component, matchedRoute.params), this.appElement);

      console.log('✅ Navigation complete');

    } catch (error) {
      console.error('❌ Navigation failed:', error);
      this.renderError(pathname, error);
    }
  }

  /**
   * Render 404 page
   */
  private render404(pathname: string): void {
    const NotFound = () => h('div', {
      style: 'padding: 2rem; text-align: center; font-family: system-ui;'
    },
      h('h1', { style: 'color: #e74c3c;' }, '404 - Page Not Found'),
      h('p', null, `The page ${pathname} could not be found.`),
      h('div', { style: 'margin: 2rem 0;' },
        h('h3', null, 'Available Routes:'),
        h('ul', {
          style: 'list-style: none; padding: 0; max-width: 400px; margin: 0 auto;'
        },
          ...this.routes.map((route: any) =>
            h('li', { key: route.pattern, style: 'margin: 0.5rem 0;' },
              h('a', {
                href: route.pattern === '/index' ? '/' : route.pattern,
                style: 'color: #3498db; text-decoration: none; padding: 0.5rem; display: block; border: 1px solid #ddd; border-radius: 4px;'
              }, route.pattern)
            )
          )
        )
      )
    );

    render(h(NotFound), this.appElement);
  }

  /**
   * Render error page
   */
  private renderError(pathname: string, error: any): void {
    const ErrorComponent = () => h('div', {
      style: 'padding: 2rem; text-align: center; color: #e74c3c; font-family: system-ui;'
    },
      h('h1', null, '🚨 Navigation Error'),
      h('p', null, `Failed to navigate to: ${pathname}`),
      h('pre', {
        style: 'background: #f8f8f8; padding: 1rem; margin: 1rem 0; text-align: left; border-radius: 4px; max-width: 600px; margin: 1rem auto; overflow: auto;'
      }, error instanceof Error ? error.message : String(error)),
      h('div', { style: 'margin-top: 2rem;' },
        h('button', {
          onClick: () => window.location.href = '/',
          style: 'padding: 0.5rem 1rem; margin: 0.5rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;'
        }, 'Go Home'),
        h('button', {
          onClick: () => window.location.reload(),
          style: 'padding: 0.5rem 1rem; margin: 0.5rem; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;'
        }, 'Reload Page')
      )
    );

    render(h(ErrorComponent), this.appElement);
  }
}

/**
 * Set up hot reload WebSocket connection
 */
function setupHotReload(): void {
  // Prevent double connections
  if ((window as any).__alfHMR) return;
  (window as any).__alfHMR = true;

  try {
    const wsUrl = (() => {
      const { protocol, host } = window.location;
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${host}/__alf_ws`;
    })();

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🔥 Hot reload connected');
    };

    ws.onmessage = (event) => {
      if (event.data === 'reload') {
        console.log('🔄 Hot reload triggered');
        window.location.reload();
      }
    };

    ws.onclose = () => {
      console.log('🔥 Hot reload disconnected');
      // Attempt to reconnect after delay
      setTimeout(setupHotReload, 1000);
    };

    ws.onerror = (error) => {
      console.log('🔥 Hot reload error:', error);
    };

  } catch (error) {
    console.log('🔥 Hot reload setup failed:', error);
  }
}

/**
 * Show client error fallback UI
 */
function showClientError(message: string, error: any): void {
  const errorHtml = `
    <div style="padding: 2rem; color: #e74c3c; font-family: system-ui; max-width: 600px; margin: 2rem auto; border: 1px solid #e74c3c; border-radius: 4px;">
      <h2>🚨 Client Error</h2>
      <p>${message}</p>
      <pre style="background: #f8f8f8; padding: 1rem; border-radius: 4px; overflow: auto;">${error instanceof Error ? error.stack || error.message : String(error)}</pre>
      <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 1rem;">
        Reload Page
      </button>
    </div>
  `;

  const appElement = document.getElementById('app');
  if (appElement) {
    appElement.innerHTML = errorHtml;
  } else {
    document.body.innerHTML = errorHtml;
  }
}

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeClient);
  } else {
    initializeClient();
  }
}
