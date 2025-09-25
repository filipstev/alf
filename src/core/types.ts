/**
 * Core type definitions for the Alf framework
 */

export type Listener = () => void;
export type ComputedFn<T> = () => T;
export type EffectFn = () => void | (() => void);

/**
 * Signal interface - reactive primitive
 */
export interface Signal<T> {
  (): T;
  (value: T): T;
  peek(): T;
  set(value: T): void;
  update(fn: (prev: T) => T): void;
}

/**
 * Computed signal interface - derived reactive value
 */
export interface ComputedSignal<T> {
  (): T;
  peek(): T;
}

/**
 * JSX/Virtual DOM types
 */
export type AlfProps = Record<string, any>;

export interface AlfElement {
  type: string | Function;
  props: AlfProps;
  children: AlfNode[];
}

export type AlfNode = AlfElement | string | number | boolean | null | undefined;

/**
 * DOM types for rendering
 */
export type DOMNode = Element | Text | Comment;

/**
 * JSX namespace declarations to override React types
 */
declare global {
  namespace JSX {
    interface Element extends AlfElement {}

    interface IntrinsicElements {
      [elemName: string]: AlfProps;
    }
  }
}