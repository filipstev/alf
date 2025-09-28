# Alf Improvement Tickets

These tickets capture architectural follow-ups and learning-friendly tasks for strengthening the Alf framework. Each ticket lists why it matters, suggested approach pointers, and an estimated difficulty so you can pick based on what you want to learn next.

## High Priority

### TCK-001 · Fix component re-render insertion (Critical)
- **Problem**: `createComponent` in `src/core/render.ts` recomputes component output inside an `effect`, but the new DOM nodes never replace the old ones. Reactive updates silently fail beyond the initial mount.
- **Direction**: Keep references to the mounted nodes, and when the effect reruns, diff or at minimum replace the subtree in place (e.g., remove previous nodes before appending the re-rendered ones). Start simple with full subtree replacement while wiring cleanup.
- **Why now**: Without this, signals don’t actually drive updates, so runtime demos break once state changes.
- **Difficulty**: ⚠️ Medium (core renderer, but contained).

### TCK-002 · Preserve reactive children instead of stringifying signals
- **Problem**: `h()` in `src/core/jsx.ts` eagerly calls function children and stores their string output, breaking live signal updates in text nodes.
- **Direction**: Detect signal-like functions (check for `.peek` or a marker) and pass them through so the renderer can subscribe. Alternatively, wrap them in a lightweight descriptor that the renderer knows how to handle.
- **Why now**: Enables fine-grained updates for inline text and attributes per framework goal.
- **Difficulty**: ⚠️ Medium.

### TCK-003 · Solidify SSR component loading paths
- **Problem**: `component: () => import(filePath)` in `src/router/router.ts` relies on runtime relative paths that may not survive bundling. `loadServerComponent` rebuilds an absolute path separately.
- **Direction**: Centralize module resolution (e.g., via `resolveRouteModule()` helper) so both server and client share logic and it works after bundling. Consider emitting manifest entries during build.
- **Why now**: Prevents production regressions once bundling lands.
- **Difficulty**: ⚠️ Medium.

## Medium Priority

### TCK-004 · Align SSR + hydration DOM reuse
- **Problem**: Client `render()` wipes `container.innerHTML`, breaking true hydration. Server sends markup but hydration replaces it completely.
- **Direction**: Add a hydration path that walks existing DOM nodes and wires listeners without clearing. Start with matching root-only components.
- **Learning focus**: DOM diffing, SSR consistency.
- **Difficulty**: ⚠️ Medium.

### TCK-005 · Formalize hot reload channel (Done)
- **Problem**: Client pointed to `/_hot-reload` while dev server exposed `/__alf_ws`.
- **Solution**: Updated `setupHotReload()` in `src/client/hydrate.ts` to derive the correct WebSocket URL from `window.location`. ✅
- **Follow-up**: Consider sending granular reload events instead of full page refreshes.
- **Difficulty**: ✅ Completed (Tiny).

### TCK-006 · Replace ad-hoc console logging with debug utility
- **Problem**: Logs like `console.log(path, "ovde")` and verbose server output clutter production builds.
- **Direction**: Introduce `src/utils/debug.ts` with log levels and environment checks. Use it across CLI, router, and client.
- **Learning focus**: Tooling discipline, Bun env handling.
- **Difficulty**: ⚙️ Easy.

### TCK-007 · Route matcher test suite
- **Problem**: No automated coverage for dynamic/catch-all routes. Edge cases may regress silently.
- **Direction**: Use `bun test` to cover `matchRoute`, including query parsing and specificity ordering.
- **Learning focus**: Bun test runner, TDD for utilities.
- **Difficulty**: ⚙️ Easy.

### TCK-008 · Document dev server flows
- **Problem**: Current docs mention dev server superficially. Hot reload, file watching, and SSR interplay aren’t documented.
- **Direction**: Expand `docs/dev-server.md` with request flow diagrams, WebSocket protocol, and troubleshooting tips.
- **Learning focus**: Documentation clarity, system design articulation.
- **Difficulty**: 📝 Easy.

## Future / Exploratory

### TCK-009 · Build pipeline + manifest generation
- **Goal**: Flesh out `src/cli/build.ts` to emit route-level bundles and a manifest consumed by SSR + client. Decide between `bun build` multi-entry or a lightweight custom bundler.
- **Difficulty**: 🚀 Large.

### TCK-010 · Introduce integration smoke test
- **Goal**: Spin up `src/cli/dev.ts` under test (or a mocked server), render a sample page, and verify hydration with `jsdom` or `happy-dom` to catch end-to-end regressions.
- **Difficulty**: 🚀 Large.

### TCK-011 · Shared router types package
- **Goal**: Extract shared route definitions/types into `src/router/shared.ts` (or similar) so they can be imported without circular dependencies.
- **Difficulty**: ⚙️ Easy-Medium.

Add new tickets as you learn more. Close them with a short summary + link to the commit for future reference.
