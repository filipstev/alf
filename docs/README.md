# Alf Documentation

Alf is a learning-focused JavaScript framework that leans on Bun for speed. These docs exist to help you understand how the pieces fit together so you can extend the framework confidently.

## Guiding Principles
- **Bun first**: Use Bun’s runtime, file APIs, bundler, and test runner wherever possible.
- **Fine-grained reactivity**: Signals and effects power updates instead of a virtual DOM diff.
- **End-to-end path**: Filesystem routing ➝ SSR ➝ hydration all live in this repository so the story stays consistent.
- **Teach by building**: Real examples and CLI tooling show how the framework behaves, not just what the API looks like.

## Repository Layout
```
alf/
├─ docs/               Reference and deep dives (start here)
├─ src/
│  ├─ core/            Reactivity, JSX runtime, and DOM renderer
│  ├─ router/          File-based route discovery and matching
│  ├─ ssr/             Server-side rendering pipeline
│  ├─ client/          Hydration and client-side navigation
│  └─ cli/             Bun-powered dev/build tooling
├─ examples/           Sample apps (portfolio starter today)
├─ tests/              Unit/integration tests (todo)
└─ pages/              Your app’s routes during development
```

## Suggested Reading Order
1. [`docs/reactivity.md`](./reactivity.md) – learn signals, computed values, and effects.
2. [`docs/jsx-runtime.md`](./jsx-runtime.md) – see how JSX maps to our renderer.
3. [`docs/router.md`](./router.md) – understand how files become routes.
4. [`docs/dev-server.md`](./dev-server.md) – tour the Bun dev server and hot reload.
5. [`docs/performance.md`](./performance.md) – gather tactics for keeping updates fast.
6. [`docs/design-decisions.md`](./design-decisions.md) – follow the reasoning behind major choices.

## Working With Alf
```bash
bun install
bun run src/cli/dev.ts    # start the dev server with SSR + hot reload
bun test                  # run tests (add coverage as you go)
```

Add questions, ideas, or gotchas directly into the relevant doc. If a concept is missing, create a stub file with the questions you want answered—future contributors will fill in the gaps faster.
