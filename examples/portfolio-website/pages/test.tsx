import { signal } from "../../../src/core";

export default function TestPage() {
  const count = signal(0);

  console.log("OVDe");

  console.log("Rendering TestPage with count:", count());

  return (
    <div>
      <h1>JSX Test Page</h1>
      <p>Count: {count()}</p>
      <button
        onClick={() => {
          console.log(count(), "ovde");
          count.set(count() + 1);
        }}
      >
        Increment
      </button>
    </div>
  );
}
