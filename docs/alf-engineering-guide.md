# Alf Engineering Guide

This guide is the running playbook for anyone working on Alf. It captures what the framework is trying to achieve, how the pieces fit together, and the habits we rely on while we build. Keep it close when you are exploring the codebase or planning changes.

## Mission & Priorities
- **Learning-first**: Every subsystem should teach by example—clean TypeScript, explicit flow, and comments only where they explain intent.
- **Bun-native speed**: Assume Bun is our runtime, bundler, and test runner. Reach for Bun APIs before reaching for Node-compat layers.
- **Tight feedback loops**: Favor tooling and architecture choices that keep the dev server snappy, rebuilds incremental, and tests instant.
- **Progressive rollout**: Ship features in vertical slices—CLI ➝ SSR ➝ hydration—so we always have something demoable.

## Architectural Snapshot
- **Core Reactivity (`src/core/reactivity.ts`)**: Fine-grained signals and effects inspired by Solid. No global scheduler yet—effects re-run immediately. Watch for potential re-entrancy when composing `effect` inside `effect`.
- **JSX Runtime (`src/core/jsx.ts` + `jsx-runtime.ts`)**: Generates lightweight element records. Child normalization is eager and coerces signal children to strings today—future work: keep signals live for streaming updates.
- **Renderer (`src/core/render.ts`)**: Creates DOM nodes on the fly and wires signals via effects. Components are functions run inside an effect; hydration will eventually need matching node reuse instead of `innerHTML` wipe.
- **Router (`src/router`)**: Filesystem-driven route table built with `fs` + `path`. Patterns map `pages/**/*.tsx` to URL templates; dynamic segments use `:param`, catch-alls use `*`. `matchRoute` currently logs to console and does not yet support nested layouts.
- **CLI (`src/cli/*.ts`)**: Bun-powered dev loop. `dev.ts` serves SSR output, proxies assets, and broadcasts hot-reload messages over WebSockets. Build/start commands are scaffolds; decide how much to rely on `bun build` vs a custom pipeline.
- **SSR (`src/ssr/render.ts`)**: Server renderer walks VDOM and emits HTML strings. No suspense/streaming yet. Client manifest support is stubbed—production bundling needs to populate it.
- **Client Hydration (`src/client/hydrate.ts`)**: Bootstraps a router, swaps the #app contents with interactive render, and manages history + link interception. Hot reload socket is separate from server’s `__alf_ws`; align channels before shipping.

## Data/Control Flows
1. **Route discovery**: Dev server boots ➝ `scanRoutes(pages)` builds table ➝ table injected into SSR output and client bootstrap.
2. **Request handling (dev)**: Incoming HTTP ➝ `handleAppRoute` ➝ SSR render with route data ➝ HTML served with hydration script ➝ client picks up state and re-renders component.
3. **Hot reload**: `fs.watch` emits change ➝ server rescan routes ➝ broadcast `reload` over WS ➝ client reload page (no module-level HMR yet).
4. **Tests**: Use `bun test`. No test suite exists—plan lightweight unit coverage for reactivity and router early.

## Coding Guidelines
- Prefer pure functions and small modules; wire them in the CLI/SSR layer.
- Keep TypeScript strict (enable `strict` in `tsconfig` once we clean up `any`s).
- When touching DOM APIs, add minimal comments describing lifecycle decisions (e.g., why we clear `innerHTML`).
- Treat console logs as debug scaffolding—wrap them behind a `debug` helper before release builds.
- When adding dependencies, ask if Bun already ships the feature before pulling a package.

## Performance Notes
- Signals mutate synchronously; batch high-frequency updates with `batch()`.
- Server render walks the tree recursively; large lists will benefit from keyed fragments once diffing lands.
- Client hydration currently re-renders whole components; revisit partial hydration after DOM reconciliation lands.
- Route matching sorts by specificity but does not yet precompile to regex—consider caching compiled matchers if routing becomes hot.

## Documentation Workflow
- Audience is curious engineers. Write in a conversational tone, avoid hype or generic bullet spam.
- Each subsystem gets a single "concept" doc plus practical snippets. Pair long-form explanation with a “why it matters” section.
- Keep examples runnable with Bun (`bun run` / `bun test`). Mark TODOs explicitly so learners understand what is still experimental.
- Central index (`docs/README.md`) should stay short and link to curated learning paths.
- Version major decisions in `docs/design-decisions.md` (ADR-style) when we commit to an approach.

## Open Questions / TODO Radar
- Align WebSocket endpoints between dev server and client (`/__alf_ws` vs `/_hot-reload`).
- Decide on bundling story (Bun.build vs Vite plugin vs esbuild) to make the manifest real.
- Flesh out CLI `build.ts` and `start.ts`; they currently fall back to dev ergonomics.
- Introduce integration tests that SSR a sample page and hydrate it under jsdom to catch regressions.
- Consider exposing a tiny logger utilities module and feature flags for experimental APIs.

## How to Use This Guide
Re-read this file when planning work. If a mental model changes (e.g., router layout support lands), update the relevant sections immediately. Treat it as our single source of truth for why Alf behaves the way it does.
