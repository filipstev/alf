import { test, expect } from "bun:test";
import { signal, computed, effect, batch } from "../src/core/index";

test("signal basic functionality", () => {
  const count = signal(0);

  expect(count()).toBe(0);

  count(5);
  expect(count()).toBe(5);

  expect(count.peek()).toBe(5);
});

test("computed signals", () => {
  const count = signal(2);
  const doubled = computed(() => count() * 2);

  expect(doubled()).toBe(4);

  count(3);
  expect(doubled()).toBe(6);
});

test("effects run on signal changes", () => {
  const count = signal(0);
  let effectRuns = 0;

  effect(() => {
    count();
    effectRuns++;
  });

  expect(effectRuns).toBe(1);

  count(1);
  expect(effectRuns).toBe(2);

  count(2);
  expect(effectRuns).toBe(3);
});

test("batch prevents intermediate updates", () => {
  const a = signal(1);
  const b = signal(2);
  let computedRuns = 0;

  const sum = computed(() => {
    computedRuns++;
    return a() + b();
  });

  expect(sum()).toBe(3);
  expect(computedRuns).toBe(1);

  batch(() => {
    a(10);
    b(20);
  });

  expect(sum()).toBe(30);
  expect(computedRuns).toBe(2);
});

test("effect cleanup", () => {
  const count = signal(0);
  let cleanupCalled = false;

  const dispose = effect(() => {
    count();
    return () => {
      cleanupCalled = true;
    };
  });

  dispose();
  expect(cleanupCalled).toBe(true);
});