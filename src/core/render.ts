/**
 * Alf Framework - Rendering System
 *
 * Converts virtual elements into real DOM nodes and manages reactive updates.
 * Provides efficient DOM manipulation with automatic reactivity integration.
 */

import type { AlfElement, AlfNode, DOMNode } from './types';
import { effect } from './reactivity';

/**
 * Renders a virtual element tree into a DOM container.
 * Automatically handles reactive updates and manages component lifecycle.
 *
 * @param element - Virtual element to render
 * @param container - DOM container to render into
 * @returns Cleanup function to dispose all reactive subscriptions
 *
 * @example
 * ```typescript
 * const App = () => h('div', null, 'Hello World');
 * const dispose = render(h(App), document.getElementById('app'));
 *
 * // Later, clean up
 * dispose();
 * ```
 */
export function render(element: AlfNode, container: Element): () => void {
  const disposers: Array<() => void> = [];

  /**
   * Converts a virtual node into DOM nodes.
   * Handles different node types: elements, components, text, etc.
   */
  const createDOMNode = (node: AlfNode): DOMNode[] => {
    // Skip null, undefined, and boolean values
    if (node == null || typeof node === "boolean") {
      return [];
    }

    // Handle text and number nodes
    if (typeof node === "string" || typeof node === "number") {
      return [document.createTextNode(String(node))];
    }

    // Handle virtual elements
    if (typeof node === "object" && "type" in node) {
      const element = node as AlfElement;

      if (typeof element.type === "string") {
        return createDOMElement(element);
      } else {
        return createComponent(element);
      }
    }

    // Fallback: convert to text
    return [document.createTextNode(String(node))];
  };

  /**
   * Creates DOM elements from virtual elements.
   * Handles attributes, event listeners, and reactive properties.
   */
  const createDOMElement = (element: AlfElement): DOMNode[] => {
    const type = element.type as string;

    // Handle fragments (elements without wrapper)
    if (type === "alf-fragment") {
      const fragments: DOMNode[] = [];
      element.children.forEach(child => {
        fragments.push(...createDOMNode(child));
      });
      return fragments;
    }

    const domElement = document.createElement(type);

    // Process props/attributes
    Object.entries(element.props).forEach(([key, value]) => {
      // Handle event listeners
      if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();
        domElement.addEventListener(eventName, value);
        return;
      }

      // Handle refs (direct DOM access)
      if (key === "ref" && typeof value === "function") {
        value(domElement);
        return;
      }

      // Handle reactive attributes (signals)
      if (typeof value === "function" && value.peek) {
        const updateAttribute = () => {
          const val = value();
          if (val == null) {
            domElement.removeAttribute(key);
          } else {
            domElement.setAttribute(key, String(val));
          }
        };

        const dispose = effect(updateAttribute);
        disposers.push(dispose);
      } else if (value != null) {
        // Handle static attributes
        domElement.setAttribute(key, String(value));
      }
    });

    // Render children
    element.children.forEach(child => {
      const childNodes = createDOMNode(child);
      childNodes.forEach(childNode => {
        domElement.appendChild(childNode);
      });
    });

    return [domElement];
  };

  /**
   * Creates DOM nodes from component functions.
   * Manages component lifecycle and reactive re-rendering.
   */
  const createComponent = (element: AlfElement): DOMNode[] => {
    const componentFn = element.type as Function;
    let rendered: AlfNode;
    let domNodes: DOMNode[] = [];

    const renderComponent = () => {
      rendered = componentFn(element.props);
      domNodes = createDOMNode(rendered);
    };

    // Create reactive effect for component updates
    const dispose = effect(() => {
      renderComponent();
    });

    disposers.push(dispose);

    return domNodes;
  };

  // Initial render
  const domNodes = createDOMNode(element);

  // Clear container and append new nodes
  container.innerHTML = "";
  domNodes.forEach(node => {
    container.appendChild(node);
  });

  // Return cleanup function
  return () => {
    disposers.forEach(dispose => dispose());
    disposers.length = 0;
  };
}