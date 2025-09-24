import { signal } from "../../../src/core/index";

export default function Home() {
  const count = signal(0);

  return (
    <div>
      <h1>Hello from Alf!</h1>
      <p>This is a reactive counter example:</p>
      <button onClick={() => count(count() + 1)}>
        Count: {count}
      </button>
    </div>
  );
}