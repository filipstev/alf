/**
 * Router type definitions for the Alf framework
 */

import type { AlfElement } from '../core/types';

/**
 * Route definition from file system scanning
 */
export interface RouteDefinition {
  /** File path relative to pages directory */
  filePath: string;
  /** URL pattern for matching (e.g., "/blog/:id") */
  pattern: string;
  /** Dynamic segments in the route */
  params: string[];
  /** Component function loaded from the file */
  component: () => Promise<{ default: Function; load?: Function }>;
}

/**
 * Matched route with extracted parameters
 */
export interface MatchedRoute {
  /** The route definition that matched */
  route: RouteDefinition;
  /** Extracted parameters from the URL */
  params: Record<string, string>;
  /** Query string parameters */
  query: Record<string, string>;
}

/**
 * Router configuration
 */
export interface RouterConfig {
  /** Base path for all routes */
  basePath?: string;
  /** Pages directory (relative to project root) */
  pagesDir?: string;
}

/**
 * Navigation options
 */
export interface NavigateOptions {
  /** Replace current history entry instead of pushing */
  replace?: boolean;
  /** Additional state to store with the navigation */
  state?: any;
}