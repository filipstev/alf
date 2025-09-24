/**
 * Alf Framework - JSX Runtime
 *
 * Provides JSX transformation and virtual DOM creation.
 * Converts JSX syntax into virtual elements that can be rendered to the DOM.
 */

import type { AlfElement, AlfNode, AlfProps } from './types';

/**
 * Creates a virtual element from JSX.
 * This is the core function that JSX compiles to.
 *
 * @param type - Element type (string for DOM elements, function for components)
 * @param props - Element properties/attributes
 * @param children - Child elements
 * @returns Virtual element object
 *
 * @example
 * ```typescript
 * // JSX: <div className="container">Hello</div>
 * // Compiles to: h("div", { className: "container" }, "Hello")
 * const element = h("div", { className: "container" }, "Hello");
 * ```
 */
export function h(
  type: string | Function,
  props?: AlfProps | null,
  ...children: AlfNode[]
): AlfElement {
  const normalizedProps: AlfProps = props || {};
  const normalizedChildren: AlfNode[] = [];

  /**
   * Recursively flattens and normalizes child elements.
   * Handles arrays, functions, and various primitive types.
   */
  const flattenChildren = (child: any): void => {
    // Skip null, undefined, and boolean values
    if (child == null || typeof child === "boolean") {
      return;
    }

    // Flatten arrays
    if (Array.isArray(child)) {
      child.forEach(flattenChildren);
      return;
    }

    // Handle strings and numbers directly
    if (typeof child === "string" || typeof child === "number") {
      normalizedChildren.push(child);
      return;
    }

    // Handle virtual elements
    if (typeof child === "object" && child.type) {
      normalizedChildren.push(child);
      return;
    }

    // Handle functions (likely signals)
    if (typeof child === "function") {
      normalizedChildren.push(String(child()));
      return;
    }

    // Convert everything else to string
    normalizedChildren.push(String(child));
  };

  children.forEach(flattenChildren);

  return {
    type,
    props: normalizedProps,
    children: normalizedChildren,
  };
}

/**
 * Fragment component for grouping multiple elements without a wrapper.
 *
 * @param props - Props containing children
 * @returns Virtual fragment element
 *
 * @example
 * ```jsx
 * <Fragment>
 *   <div>First</div>
 *   <div>Second</div>
 * </Fragment>
 * ```
 */
export function Fragment(props: { children: AlfNode[] }): AlfElement {
  return h("alf-fragment", {}, ...props.children);
}