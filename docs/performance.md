# Performance Guide

This guide outlines how we think about performance in Alf and the practices we rely on when measuring and improving it. Keep it practical: measure first, optimize second, document what you learn.

## What Performance Means Here
- **Fast feedback for developers**: quick SSR responses, instant hot reload, minimal rebuild time.
- **Predictable rendering**: signals update the DOM without layout thrash or extra work.
- **Compact output**: ship only what the browser needs; let Bun’s bundler do the heavy lifting.

## Measuring Baselines
1. **Server render latency**: use Bun’s built-in profiler (`bun --inspect`) or simple timers around `renderPage` to understand SSR cost.
2. **Client hydration time**: instrument `initializeClient` and `render` in `src/client/hydrate.ts` to capture how long it takes to attach interactivity.
3. **Bundle size**: once the build pipeline lands, track output with `bun build --summary` or `stat` the emitted assets.
4. **Routing throughput**: add unit tests that run `matchRoute` across large tables and record ops/sec with `performance.now()`.

Write results into the docs (with date + commit hash) when you have real numbers.

## Optimization Playbook
- **Batch signal updates**: wrap related state changes in `batch()` to avoid redundant re-computation.
- **Lazy work in components**: compute heavy values with `computed()` so they only run when dependencies change.
- **Avoid DOM churn**: when you need frequent updates, target text nodes or attributes instead of re-rendering entire subtrees.
- **Cache route matchers**: `matchRoute` currently parses patterns on every navigation—memoize compiled matchers when routing becomes hot.
- **Strip debug logs**: centralize logging behind a helper so production builds can drop them.

## Profiling Tools
- **Bun Inspector**: `bun --inspect src/cli/dev.ts` opens a Chrome DevTools session to inspect CPU and memory usage.
- **Web Vitals**: run `bun run src/cli/dev.ts`, open the app in Chrome, and record Lighthouse metrics to validate hydration and TTI.
- **Custom benchmarks**: create scripts under `tests/perf/*.ts` and run them with `bun test --filter perf` to keep regressions visible.

## Tracking Improvements
Document any performance work in `docs/design-decisions.md` with:
- date and commit
- change made
- numbers *before* and *after*
- follow-up ideas

Future contributors should be able to trace why a micro-optimization exists and whether the reasoning still holds.
