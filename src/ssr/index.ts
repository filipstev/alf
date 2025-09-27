/**
 * Alf Framework - Server-Side Rendering
 *
 * Server-only exports for SSR functionality.
 * Client hydration is now handled by src/client/hydrate.ts
 */

// Server-side rendering exports
export { renderToString, renderPage } from './render';

// Legacy exports for compatibility (deprecated)
export { renderToString as renderComponentToString } from './render';