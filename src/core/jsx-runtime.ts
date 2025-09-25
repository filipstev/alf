import { h, Fragment, type AlfElement, type AlfNode, type AlfProps } from "./index";

export function jsx(
  type: string | Function,
  props: AlfProps,
  key?: string
): AlfElement {
  const { children, ...restProps } = props;
  if (children === undefined) {
    return h(type, restProps);
  }
  if (Array.isArray(children)) {
    return h(type, restProps, ...children);
  }
  return h(type, restProps, children);
}

export const jsxs = jsx;
export { Fragment };

export type { AlfElement, AlfNode, AlfProps };

// Re-export JSX types for TypeScript JSX resolution
export * from './types';