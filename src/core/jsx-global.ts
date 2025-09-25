/**
 * Global JSX setup for Alf framework
 *
 * This file automatically sets up JSX globals when the framework is imported.
 * Users don't need to configure anything - just import from the framework
 * and JSX will work automatically.
 */

import { h, Fragment } from './jsx';

/**
 * Set up global JSX functions for TypeScript's classic JSX transform
 * This allows users to write JSX without manual imports
 */
declare global {
  var h: typeof import('./jsx').h;
  var Fragment: typeof import('./jsx').Fragment;
}

// Set up globals automatically when this module is imported
if (typeof globalThis !== 'undefined') {
  globalThis.h = h;
  globalThis.Fragment = Fragment;
}