# Rendering Engine - Deep Dive

**From Virtual Elements to Living DOM**

The rendering engine is where Alf's virtual elements become real DOM nodes with reactive superpowers. This system transforms static virtual structures into dynamic, automatically-updating user interfaces.

## 🎯 **Core Rendering Philosophy**

Unlike React's reconciliation or Vue's patch system, Alf's renderer follows these principles:

1. **Create once, update in place** - DOM elements are created once, then specific properties update reactively
2. **Direct DOM manipulation** - No virtual DOM diffing, just surgical updates
3. **Automatic subscriptions** - Reactive values automatically subscribe to update their DOM representations
4. **Component boundaries** - Components are functions that run once, returning static structure with dynamic content

## 🏗️ **The render() Function**

### Function Signature

```typescript
export function render(element: AlfNode, container: Element): () => void
```

**Returns a cleanup function** - This is crucial for preventing memory leaks. When you're done with a rendered tree, call the cleanup function to remove all reactive subscriptions.

### The Disposal System

```typescript
export function render(element: AlfNode, container: Element): () => void {
  const disposers: Array<() => void> = [];  // Track all subscriptions

  // ... rendering logic ...

  return () => {
    disposers.forEach(dispose => dispose()); // Clean up everything
    disposers.length = 0;
  };
}
```

**Why track disposers?** Every reactive subscription needs cleanup to prevent memory leaks. When signals change but the DOM element no longer exists, we need to unsubscribe.

## 🌳 **The DOM Creation Pipeline**

### 1. Node Type Detection

```typescript
const createDOMNode = (node: AlfNode): DOMNode[] => {
  // Skip null, undefined, and boolean values
  if (node == null || typeof node === "boolean") {
    return [];  // These don't create DOM nodes
  }

  // Handle text and number nodes
  if (typeof node === "string" || typeof node === "number") {
    return [document.createTextNode(String(node))];
  }

  // Handle virtual elements
  if (typeof node === "object" && "type" in node) {
    const element = node as AlfElement;

    if (typeof element.type === "string") {
      return createDOMElement(element);  // DOM element
    } else {
      return createComponent(element);   // Component function
    }
  }

  // Fallback: convert to text
  return [document.createTextNode(String(node))];
};
```

**Why return arrays?** Some virtual nodes (like fragments) can create multiple DOM nodes. Arrays handle this uniformly.

**Text node creation:** `document.createTextNode()` is the fastest way to create text content. It's more efficient than setting `innerHTML` or `textContent` on elements.

### 2. DOM Element Creation

```typescript
const createDOMElement = (element: AlfElement): DOMNode[] => {
  const type = element.type as string;

  // Handle fragments (elements without wrapper)
  if (type === "alf-fragment") {
    const fragments: DOMNode[] = [];
    element.children.forEach(child => {
      fragments.push(...createDOMNode(child));  // Flatten children
    });
    return fragments;
  }

  const domElement = document.createElement(type);
```

**Fragment handling:** Fragments are special - they don't create a wrapper element, just return their children directly. This is essential for valid HTML structure.

### 3. Props Processing - The Complex Part

```typescript
Object.entries(element.props).forEach(([key, value]) => {
  // Handle event listeners
  if (key.startsWith("on") && typeof value === "function") {
    const eventName = key.slice(2).toLowerCase();  // onClick → click
    domElement.addEventListener(eventName, value);
    return;
  }

  // Handle refs (direct DOM access)
  if (key === "ref" && typeof value === "function") {
    value(domElement);  // Call ref function with DOM element
    return;
  }

  // Handle reactive attributes (signals)
  if (typeof value === "function" && value.peek) {
    const updateAttribute = () => {
      const val = value();  // Read reactive value
      if (val == null) {
        domElement.removeAttribute(key);
      } else {
        domElement.setAttribute(key, String(val));
      }
    };

    const dispose = effect(updateAttribute);  // Set up reactive subscription
    disposers.push(dispose);                  // Track for cleanup
  } else if (value != null) {
    // Handle static attributes
    domElement.setAttribute(key, String(value));
  }
});
```

Let's break down each prop type:

#### Event Listeners
```jsx
<button onClick={handleClick}>Click me</button>
```

**Why `slice(2).toLowerCase()`?** JSX uses `onClick`, but DOM uses `click`. We convert the naming convention.

**Direct event binding:** We add listeners directly to DOM elements. No event delegation or synthetic events - just native performance.

#### Refs
```jsx
<input ref={(el) => inputRef.current = el} />
```

**Immediate callback:** The ref function is called as soon as the DOM element is created, giving you direct access for imperative operations.

#### Reactive Attributes
```jsx
<div className={isActive() ? "active" : "inactive"}>Content</div>
```

**Signal detection:** We check if the value has a `peek` method - this identifies it as a signal.

**Effect subscription:** We create an effect that re-runs when the signal changes, updating the DOM attribute. This is the core of Alf's reactivity!

**Null handling:** If a signal returns `null` or `undefined`, we remove the attribute entirely. This is useful for conditional classes or styles.

### 4. Component Rendering

```typescript
const createComponent = (element: AlfElement): DOMNode[] => {
  const componentFn = element.type as Function;
  let rendered: AlfNode;
  let domNodes: DOMNode[] = [];

  const renderComponent = () => {
    rendered = componentFn(element.props);  // Call component function
    domNodes = createDOMNode(rendered);     // Convert result to DOM
  };

  // Create reactive effect for component updates
  const dispose = effect(() => {
    renderComponent();
  });

  disposers.push(dispose);
  return domNodes;
};
```

**Component execution:** Components are just functions. We call them with their props and render the result.

**Reactive components:** If a component reads signals, it will automatically re-run when those signals change. This is how component updates work in Alf.

**Why effect for components?** Components might read signals directly:

```typescript
function Counter() {
  const count = signal(0);

  // If count() was called here, the component would re-run when count changes
  return h('div', null, `Count: ${count()}`);
}
```

## ⚡ **Reactive DOM Updates**

### How Signals Update the DOM

When you write:
```jsx
<div>{message}</div>
```

And `message` is a signal, here's what happens:

1. **Initial render:** `message()` is called, returning current value (e.g., "Hello")
2. **Text node creation:** `document.createTextNode("Hello")` creates the DOM node
3. **Effect setup:** An effect is created that watches for `message` changes
4. **Signal change:** When `message("World")` is called
5. **Automatic update:** The effect re-runs, updating the text node to "World"

### Example: Reactive Class Names

```jsx
function ToggleButton() {
  const isOn = signal(false);

  return (
    <button
      className={isOn() ? "on" : "off"}
      onClick={() => isOn(!isOn())}
    >
      {isOn() ? "Turn Off" : "Turn On"}
    </button>
  );
}
```

**Two reactive subscriptions are created:**
1. One for the `className` attribute
2. One for the button text content

When `isOn` changes, both update automatically!

## 🔄 **Component Lifecycle**

### Component Function Execution

```typescript
function UserProfile({ user }) {
  const isExpanded = signal(false);  // Local component state

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => isExpanded(!isExpanded())}>
        Toggle Details
      </button>
      {isExpanded() && <UserDetails user={user} />}
    </div>
  );
}
```

**Component runs once:** The `UserProfile` function executes once when the component is created. It returns a static virtual element tree.

**Local state:** Signals created inside components are scoped to that component instance.

**Reactive content:** The `{isExpanded() && <UserDetails>}` part will automatically show/hide when `isExpanded` changes.

### Cleanup and Memory Management

```typescript
// When a component is removed from the DOM:
const dispose = render(element, container);

// Later...
dispose(); // This removes all reactive subscriptions
```

**Automatic cleanup:** All effects created during rendering are tracked and cleaned up together.

**No memory leaks:** Unlike some reactive systems, Alf automatically handles subscription cleanup.

## 🎨 **Advanced Rendering Features**

### Conditional Rendering

```jsx
{isLoggedIn() && <UserMenu />}
{error() && <ErrorMessage error={error()} />}
{items().map(item => <Item key={item.id} data={item} />)}
```

**Boolean short-circuit:** `false && <Component>` returns `false`, which our renderer skips.

**Dynamic lists:** Arrays of elements are flattened and rendered individually.

### Nested Components

```jsx
function App() {
  return (
    <Layout>
      <Header />
      <Main>
        <Sidebar />
        <Content />
      </Main>
    </Layout>
  );
}
```

**Component nesting:** Each component function is called with its props, and the result is recursively processed.

**Props passing:** Props flow down through the component tree naturally.

## 🧪 **Testing the Renderer**

Our tests verify the rendering system works correctly:

```typescript
test("render simple element", () => {
  const element = h("div", { id: "test" }, "Hello World");
  render(element, container);

  expect(container.innerHTML).toBe('<div id="test">Hello World</div>');
});

test("render reactive component", () => {
  const count = signal(0);

  const Counter = () => {
    return h("div", null, `Count: ${count()}`);
  };

  const element = h(Counter, {});
  render(element, container);

  expect(container.innerHTML).toBe('<div>Count: 0</div>');

  count(5);
  // The DOM should automatically update (in a real browser environment)
});
```

## 🤔 **Design Decisions**

### Why Direct DOM Manipulation?

**Performance:** No virtual DOM overhead or diffing algorithms
**Simplicity:** Easier to understand and debug
**Size:** Smaller bundle without virtual DOM implementation
**Precision:** Only the exact nodes that need updates change

### Why Arrays of DOM Nodes?

```typescript
const createDOMNode = (node: AlfNode): DOMNode[] => // Array return
```

**Fragments:** `<><div/><div/></>` creates multiple DOM nodes
**Consistency:** All creation functions return the same type
**Flattening:** Easy to combine results from multiple sources

### Why Effects for Components?

```typescript
const dispose = effect(() => {
  renderComponent();
});
```

**Automatic updates:** Components re-run when their signal dependencies change
**Granular control:** Only components that use changed signals re-run
**No manual subscriptions:** The effect system handles dependencies automatically

## 🔗 **Integration with Router**

The rendering system works seamlessly with our router:

```jsx
function App() {
  return (
    <div>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
      </nav>
      <main>
        <Router />  {/* This renders the current route component */}
      </main>
    </div>
  );
}
```

The `Router` component uses signals to track the current route and automatically renders the appropriate page component when the URL changes.

This rendering system provides the foundation for fast, reactive user interfaces that scale from simple widgets to complex applications!