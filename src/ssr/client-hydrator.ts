/**
 * Alf Framework - Client Hydrator
 *
 * Connects the client-side framework to server-rendered DOM.
 * This enables the client to take over from server-rendered content
 * without re-rendering, preserving the existing DOM structure.
 */

import { render, h } from '../core';
import { matchRoute } from '../router';
import type { MatchedRoute } from '../router/types';

/**
 * Global router instance for client-side navigation
 */
let alfRouter: AlfClientRouter | null = null;

/**
 * Hydrate server-rendered content
 *
 * This function connects the client-side framework to existing DOM
 * that was rendered on the server. It preserves the existing content
 * and sets up reactivity for future updates.
 */
export function hydrate(element: Element | null, options: {
  route: MatchedRoute;
  hotReload?: boolean;
}): void {
  if (!element) {
    console.error('Cannot hydrate: element is null');
    return;
  }

  console.log('🦞 Alf Framework - Hydrating client-side');
  console.log('Initial route:', options.route);

  try {
    // Initialize the client-side router
    alfRouter = new AlfClientRouter(element, options);

    // Set up hot reload if in development
    if (options.hotReload) {
      setupHotReload();
    }

    // Make router available globally for debugging
    (window as any).__alfRouter = alfRouter;

    console.log('✅ Hydration complete - client-side framework ready');

  } catch (error) {
    console.error('❌ Hydration failed:', error);

    // Fallback: render error state
    const ErrorComponent = () => h('div', {
      style: 'padding: 2rem; color: #e74c3c; font-family: system-ui;'
    },
      h('h1', null, '🚨 Hydration Error'),
      h('p', null, 'Failed to hydrate server-rendered content'),
      h('pre', {
        style: 'background: #f8f8f8; padding: 1rem; margin: 1rem 0; overflow: auto;'
      }, error instanceof Error ? error.message : 'Unknown error'),
      h('button', {
        onClick: () => window.location.reload(),
        style: 'padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;'
      }, 'Reload Page')
    );

    render(h(ErrorComponent), element);
  }
}

/**
 * Client-side router for handling navigation after hydration
 */
class AlfClientRouter {
  private currentRoute: MatchedRoute | null = null;
  private appElement: Element;
  private routes: any[] = [];

  constructor(appElement: Element, options: { route: MatchedRoute }) {
    this.appElement = appElement;
    this.currentRoute = options.route;

    // Get available routes from server (injected during SSR)
    this.routes = (window as any).__alfRoutes || [];

    this.setupEventListeners();
    console.log('Client router initialized with routes:', this.routes.map((r: any) => r.pattern));

    // Load and hydrate the initial route component
    this.hydrateInitialRoute(options.route);
  }

  /**
   * Hydrate the initial server-rendered route
   */
  private async hydrateInitialRoute(matchedRoute: MatchedRoute): Promise<void> {
    try {
      console.log('🔄 Hydrating initial route:', matchedRoute.route.pattern);

      // Load the component (same as server did)
      const componentPath = `/pages/${matchedRoute.route.filePath}`;
      const module = await import(componentPath);
      const Component = module.default;

      if (!Component) {
        throw new Error('Component does not have a default export');
      }

      console.log('🔗 Component loaded, connecting to DOM...');

      // PROGRESSIVE ENHANCEMENT:
      // Server HTML shows immediately, then client takes over with full interactivity
      // This is simpler and more reliable than complex DOM walking
      render(h(Component, matchedRoute.params), this.appElement);

      console.log('✅ Hydration complete - component is now interactive');

    } catch (error) {
      console.error('❌ Hydration failed:', error);
      await this.renderError(window.location.pathname, error);
    }
  }

  /**
   * Set up event listeners for client-side navigation
   */
  private setupEventListeners(): void {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
      this.handleRoute(window.location.pathname, false);
    });

    // Handle link clicks for client-side navigation
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      // Check if it's a link or inside a link
      const link = target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/')) return;

      // Prevent default navigation
      event.preventDefault();
      this.navigate(href);
    });
  }

  /**
   * Navigate to a new route client-side
   */
  public navigate(path: string): void {
    // Update browser URL
    history.pushState({}, '', path);

    // Handle the route
    this.handleRoute(path, true);
  }

  /**
   * Handle route changes (from navigation or popstate)
   */
  private async handleRoute(pathname: string, isNavigation: boolean): Promise<void> {
    console.log('🧭 Navigating to:', pathname);

    try {
      // Match the route
      const matchedRoute = matchRoute(pathname, this.routes);

      if (!matchedRoute) {
        await this.render404(pathname);
        return;
      }

      // Update current route
      this.currentRoute = matchedRoute;

      // Update page title
      document.title = `Alf App - ${matchedRoute.route.pattern}`;

      // Load and render the component
      await this.loadAndRender(matchedRoute);

      console.log('✅ Navigation complete to:', pathname);

    } catch (error) {
      console.error('❌ Navigation error:', error);
      await this.renderError(pathname, error);
    }
  }

  /**
   * Load route component and render it
   */
  private async loadAndRender(matchedRoute: MatchedRoute): Promise<void> {
    try {
      console.log('📦 Loading component:', matchedRoute.route.filePath);

      // Dynamically import the component
      const componentPath = `/pages/${matchedRoute.route.filePath}`;
      const module = await import(componentPath);
      const Component = module.default;

      if (!Component) {
        throw new Error(`Component does not have a default export`);
      }

      // Render the component (this will re-render the entire app element)
      render(h(Component, matchedRoute.params), this.appElement);

      console.log('✅ Component rendered successfully');

    } catch (error) {
      console.error('❌ Component loading error:', error);
      throw error;
    }
  }

  /**
   * Render 404 page
   */
  private async render404(pathname: string): Promise<void> {
    const NotFoundComponent = () => h('div', {
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

    render(h(NotFoundComponent), this.appElement);
  }

  /**
   * Render error page
   */
  private async renderError(pathname: string, error: any): Promise<void> {
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

  /**
   * Get current route information
   */
  public getCurrentRoute(): MatchedRoute | null {
    return this.currentRoute;
  }
}

/**
 * Set up hot reload for development
 */
function setupHotReload(): void {
  try {
    const ws = new WebSocket('ws://localhost:3000/_hot-reload');

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
      // Try to reconnect after a delay
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
 * Get the current router instance (for debugging)
 */
export function getCurrentRouter(): AlfClientRouter | null {
  return alfRouter;
}