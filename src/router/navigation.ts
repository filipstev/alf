/**
 * Alf Framework - Client-Side Navigation
 *
 * Provides Link component and programmatic navigation using the browser History API.
 * Integrates with the reactive system for automatic updates.
 */

import { signal, effect } from '../core/reactivity';
import { h } from '../core/jsx';
import type { AlfElement, AlfProps } from '../core/types';
import type { MatchedRoute, RouteDefinition, NavigateOptions } from './types';
import { matchRoute } from './router';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Global router state
export const currentPath = signal(isBrowser ? window.location.pathname : '/');
export const currentRoute = signal<MatchedRoute | null>(null);

let routeDefinitions: RouteDefinition[] = [];

/**
 * Initialize the router with route definitions
 */
export function initRouter(routes: RouteDefinition[]) {
  routeDefinitions = routes;

  // Set initial route
  updateCurrentRoute();

  // Only set up browser listeners in browser environment
  if (isBrowser) {
    // Listen for browser navigation (back/forward buttons)
    window.addEventListener('popstate', handlePopState);
  }

  // Listen for path changes and update current route
  effect(() => {
    updateCurrentRoute();
  });
}

/**
 * Update the current route based on the current path
 */
function updateCurrentRoute() {
  const path = currentPath();
  const matched = matchRoute(path, routeDefinitions);
  currentRoute(matched);
}

/**
 * Handle browser back/forward navigation
 */
function handlePopState() {
  if (isBrowser) {
    currentPath(window.location.pathname);
  }
}

/**
 * Navigate to a new path programmatically
 */
export function navigate(path: string, options: NavigateOptions = {}) {
  if (path === currentPath()) return;

  if (isBrowser) {
    if (options.replace) {
      window.history.replaceState(options.state || {}, '', path);
    } else {
      window.history.pushState(options.state || {}, '', path);
    }
  }

  currentPath(path);
}

/**
 * Link component for client-side navigation
 *
 * @example
 * ```jsx
 * <Link href="/about">About Page</Link>
 * <Link href="/blog/hello-world" className="active">Blog Post</Link>
 * ```
 */
export interface LinkProps extends AlfProps {
  href: string;
  replace?: boolean;
  className?: string;
  children: any;
}

export function Link(props: LinkProps): AlfElement {
  const { href, replace = false, children, ...restProps } = props;

  const handleClick = (event: MouseEvent) => {
    // Allow default behavior for special key combinations
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    // Allow default behavior for middle mouse button
    if (event.button === 1) {
      return;
    }

    event.preventDefault();
    navigate(href, { replace });
  };

  return h('a', {
    href,
    onClick: handleClick,
    ...restProps
  }, children);
}

/**
 * Get the current route parameters
 */
export function useParams(): Record<string, string> {
  const route = currentRoute();
  return route ? route.params : {};
}

/**
 * Get the current query parameters
 */
export function useQuery(): Record<string, string> {
  const route = currentRoute();
  return route ? route.query : {};
}

/**
 * Check if a path is currently active
 */
export function isActiveRoute(path: string): boolean {
  return currentPath() === path;
}

/**
 * Router component that renders the current route
 */
export function Router(): AlfElement {
  return h('div', { 'data-router': 'true' },
    h(() => {
      const route = currentRoute();

      if (!route) {
        return h('div', null, 'Route not found: ', currentPath());
      }

      // Load and render the component
      return h('div', { 'data-route': route.route.pattern },
        h(async () => {
          try {
            const module = await route.route.component();
            const Component = module.default;

            // Pass route data as props
            const routeProps = {
              params: route.params,
              query: route.query,
              path: currentPath()
            };

            // If component has a load function, call it first
            if (module.load) {
              const loadedData = await module.load(routeProps);
              return h(Component, { ...routeProps, ...loadedData });
            }

            return h(Component, routeProps);
          } catch (error) {
            console.error('Error loading route component:', error);
            return h('div', null, 'Error loading page');
          }
        })
      );
    })
  );
}