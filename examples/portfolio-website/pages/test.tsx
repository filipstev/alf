import { signal } from "../../../src/core";

export default function TestPage() {
  const count = signal(0);

  return (
    <div>
      <h1>JSX Test Page</h1>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>Increment</button>
    </div>
  );
}
