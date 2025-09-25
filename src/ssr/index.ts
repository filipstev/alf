/**
 * Alf Framework - Server-Side Rendering
 *
 * Public API for SSR functionality. This module provides the main
 * functions needed to render components on the server and hydrate
 * them on the client.
 */

export { renderToString, renderPage } from './server-renderer';
export { hydrate, getCurrentRouter } from './client-hydrator';