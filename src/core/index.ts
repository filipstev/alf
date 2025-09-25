/**
 * Alf Framework - Core Module
 *
 * A reactive JavaScript framework built on Bun.
 * Provides fine-grained reactivity, JSX runtime, and efficient DOM rendering.
 */

// Set up JSX globals automatically
import './jsx-global';

// Export all types
export type {
  Signal,
  ComputedSignal,
  AlfElement,
  AlfNode,
  AlfProps,
  DOMNode
} from './types';

// Export reactivity system
export {
  signal,
  computed,
  effect,
  batch
} from './reactivity';

// Export JSX system
export {
  h,
  Fragment
} from './jsx';

// Export rendering system
export {
  render
} from './render';