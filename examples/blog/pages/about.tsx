import { signal, computed } from "../../../src/core/index";

export default function About() {
  const name = signal("Alf");
  const greeting = computed(() => `Hello, ${name()}!`);

  return (
    <div>
      <h1>About page</h1>
      <p>
        This is the about page for the Alf framework - a reactive JavaScript framework built on Bun.
      </p>
      <div>
        <input
          type="text"
          value={name()}
          onInput={(e) => name(e.target.value)}
          placeholder="Enter your name"
        />
        <p>{greeting}</p>
      </div>
    </div>
  );
}