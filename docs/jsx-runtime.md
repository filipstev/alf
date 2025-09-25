# JSX Runtime - Deep Dive

**From JSX Syntax to Virtual Elements to Real DOM**

The JSX runtime is responsible for converting your familiar JSX syntax into virtual elements that our rendering system can process. This system is inspired by React's reconciliation but designed specifically to work with our fine-grained reactivity.

## 🎯 **The JSX Transformation Pipeline**

### Step 1: JSX Syntax (What you write)
```jsx
<button onClick={() => count(count() + 1)}>
  Count: {count}
</button>
```

### Step 2: TypeScript/Babel Transform (Automatic)
```typescript
h("button", { onClick: () => count(count() + 1) }, "Count: ", count)
```

### Step 3: Virtual Element (What h() returns)
```typescript
{
  type: "button",
  props: { onClick: [Function] },
  children: ["Count: ", [Function: signal]]
}
```

### Step 4: Real DOM (What render() creates)
```html
<button>Count: 0</button>
<!-- + event listener + reactive subscription -->
```

## 🏗️ **The h() Function - Heart of JSX**

The `h()` function (short for "hyperscript") is our JSX factory. Let's examine it line by line:

### Function Signature

```typescript
export function h(
  type: string | Function,        // Element type or component function
  props?: AlfProps | null,        // Properties/attributes
  ...children: AlfNode[]          // Child elements
): AlfElement
```

**Why this signature?** This matches React's `createElement` API, making it familiar to developers. The rest parameters for children allow unlimited child elements.

### Props Normalization

```typescript
const normalizedProps: AlfProps = props || {};
const normalizedChildren: AlfNode[] = [];
```

**Null handling:** JSX can pass `null` props (for elements without attributes), so we default to an empty object for consistent property access.

### Child Processing - The Complex Part

```typescript
const flattenChildren = (child: any): void => {
  // Skip null, undefined, and boolean values
  if (child == null || typeof child === "boolean") {
    return;  // These don't render anything
  }
```

**Why skip booleans/null?** JSX uses these for conditional rendering:
```jsx
{isLoggedIn && <UserMenu />}    // Boolean && JSX
{user?.name}                    // Potentially undefined
```

### Array Flattening

```typescript
if (Array.isArray(child)) {
  child.forEach(flattenChildren);  // Recursive flattening
  return;
}
```

**Why flatten arrays?** JSX can contain arrays of elements:
```jsx
<ul>
  {items.map(item => <li key={item.id}>{item.name}</li>)}
</ul>
```

The `.map()` returns an array, but we need individual elements.

### Text Content Handling

```typescript
if (typeof child === "string" || typeof child === "number") {
  normalizedChildren.push(child);
  return;
}
```

**Direct text support:** Strings and numbers become text nodes directly. No wrapper needed.

### Virtual Elements

```typescript
if (typeof child === "object" && child.type) {
  normalizedChildren.push(child);  // Already a virtual element
  return;
}
```

**Nested component support:** When components return other elements, we pass them through unchanged.

### Signal Integration

```typescript
if (typeof child === "function") {
  normalizedChildren.push(String(child()));  // Call signal and convert to string
  return;
}
```

**Reactive content:** This is where the magic happens! When you write `{count}` in JSX, the signal function gets called to get its current value.

**Why convert to string?** DOM text nodes only accept strings. The rendering system will set up reactive subscriptions to update this text when the signal changes.

## 🧩 **Component vs Element Handling**

### DOM Elements (strings)

```jsx
<div className="container">Content</div>
```

Becomes:
```typescript
{
  type: "div",                           // String type = DOM element
  props: { className: "container" },
  children: ["Content"]
}
```

### Components (functions)

```jsx
<UserProfile user={currentUser} />
```

Becomes:
```typescript
{
  type: UserProfile,                     // Function type = component
  props: { user: currentUser },
  children: []
}
```

**The rendering system handles these differently:**
- **String types** → Create DOM elements directly
- **Function types** → Call the function with props, then process the result

## 🔄 **The jsx-runtime.ts Bridge**

Modern build tools (including Bun) can automatically transform JSX without requiring manual `h()` imports:

```typescript
// jsx-runtime.ts
export function jsx(
  type: string | Function,
  props: AlfProps,
  key?: string
): AlfElement {
  const { children, ...restProps } = props;

  if (children === undefined) {
    return h(type, restProps);              // No children
  }

  if (Array.isArray(children)) {
    return h(type, restProps, ...children); // Spread array children
  }

  return h(type, restProps, children);      // Single child
}

export const jsxs = jsx;  // Same function for multiple children
```

**Why separate jsx and jsxs?** The JSX transform distinguishes between elements with single vs multiple children for optimization. We treat them the same for simplicity.

### Automatic Import Configuration

In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "./src/core"
  }
}
```

This tells TypeScript to:
1. Use the new JSX transform (not legacy `React.createElement`)
2. Import from our `jsx-runtime.ts` instead of React

## 🎭 **Fragment Support**

Fragments let you return multiple elements without a wrapper:

```jsx
function UserInfo() {
  return (
    <>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </>
  );
}
```

### Fragment Implementation

```typescript
export function Fragment(props: { children: AlfNode[] }): AlfElement {
  return h("alf-fragment", {}, ...props.children);
}
```

**Why "alf-fragment"?** We use a special element type that the renderer recognizes. When it sees "alf-fragment", it renders the children directly without creating a wrapper element.

## 🔧 **Advanced JSX Features**

### Reactive Attributes

```jsx
<div className={isActive() ? "active" : "inactive"}>
  Content
</div>
```

The signal `isActive` gets called every render. Our renderer will set up a reactive subscription to update the `className` when `isActive` changes.

### Event Handlers

```jsx
<button onClick={(e) => handleClick(e)}>
  Click me
</button>
```

Event handlers are passed through as-is. The renderer detects props starting with "on" and adds them as DOM event listeners.

### Refs (Direct DOM Access)

```jsx
<input ref={(el) => inputRef.current = el} />
```

Sometimes you need direct DOM access. The `ref` prop receives the actual DOM element after it's created.

## 🎨 **Type Definitions**

### Core Types

```typescript
export type AlfProps = Record<string, any>;  // Flexible prop types

export interface AlfElement {
  type: string | Function;    // DOM tag or component function
  props: AlfProps;           // All attributes/properties
  children: AlfNode[];       // Processed children
}

export type AlfNode =
  | AlfElement                // Nested elements
  | string                    // Text content
  | number                    // Numeric content
  | boolean                   // Conditional rendering (filtered out)
  | null                      // Conditional rendering (filtered out)
  | undefined;                // Conditional rendering (filtered out)
```

**Why allow primitive types?** JSX expressions can return various types:
- `{user.name}` → string
- `{user.age}` → number
- `{isVisible && <div />}` → boolean or element

## 🧪 **Testing JSX Processing**

Our tests verify the JSX system handles all these cases:

```typescript
test("h function creates elements", () => {
  const element = h("div", { id: "test" }, "Hello World");

  expect(element.type).toBe("div");
  expect(element.props.id).toBe("test");
  expect(element.children).toEqual(["Hello World"]);
});

test("h function handles nested elements", () => {
  const child = h("span", null, "Child");
  const parent = h("div", null, child);

  expect(parent.children[0]).toBe(child);  // Nested structure preserved
});
```

## 🤔 **Design Decisions**

### Why Not Use React's JSX?

**Size:** React's JSX runtime includes virtual DOM diffing logic we don't need
**Integration:** Our system needs to work with signals, not React state
**Performance:** We can optimize for our specific reactivity model

### Why Not Clone Solid's JSX?

**Learning:** Building our own helps understand the concepts deeply
**Customization:** We can add Alf-specific optimizations
**Bun integration:** We can leverage Bun-specific features

### Why String Conversion for Signals?

```typescript
// In flattenChildren:
if (typeof child === "function") {
  normalizedChildren.push(String(child()));  // Why String()?
}
```

**DOM requirement:** Text nodes must be strings
**Consistency:** Numbers, booleans, objects all become strings in DOM
**Performance:** One-time conversion during initial render, then reactive updates handle changes

## 🔗 **Integration with Rendering**

The JSX system creates the virtual element tree, but it's the **rendering system** that:

1. Creates real DOM elements
2. Sets up reactive subscriptions for dynamic content
3. Handles event listeners
4. Manages component lifecycles

Next, let's explore how the rendering system brings these virtual elements to life!