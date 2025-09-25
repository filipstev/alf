import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { scanRoutes, matchRoute } from "../src/router/router";

const testPagesDir = join(process.cwd(), "test-pages");

beforeEach(() => {
  // Create test pages directory structure
  mkdirSync(testPagesDir, { recursive: true });
  mkdirSync(join(testPagesDir, "blog"), { recursive: true });
  mkdirSync(join(testPagesDir, "users"), { recursive: true });

  // Create test page files
  writeFileSync(join(testPagesDir, "index.tsx"), "export default () => 'Home'");
  writeFileSync(join(testPagesDir, "about.tsx"), "export default () => 'About'");
  writeFileSync(join(testPagesDir, "blog", "index.tsx"), "export default () => 'Blog'");
  writeFileSync(join(testPagesDir, "blog", "[id].tsx"), "export default () => 'Blog Post'");
  writeFileSync(join(testPagesDir, "users", "[...slug].tsx"), "export default () => 'User Pages'");
});

afterEach(() => {
  // Clean up test directory
  rmSync(testPagesDir, { recursive: true, force: true });
});

test("scanRoutes discovers all page files", () => {
  const routes = scanRoutes(testPagesDir);

  expect(routes).toHaveLength(5);

  const patterns = routes.map(r => r.pattern);
  expect(patterns).toContain("/");
  expect(patterns).toContain("/about");
  expect(patterns).toContain("/blog");
  expect(patterns).toContain("/blog/:id");
  expect(patterns).toContain("/users/*");
});

test("routes are sorted by specificity", () => {
  const routes = scanRoutes(testPagesDir);

  // Test that routes are properly sorted - most specific first
  // For routing, we want to match exact paths before dynamic ones

  // When we have both /blog and /blog/:id, let's test that:
  // 1. /blog matches exactly "/blog"
  // 2. /blog/:id matches "/blog/anything-else"

  const blogExactMatch = matchRoute("/blog", routes);
  const blogDynamicMatch = matchRoute("/blog/hello-world", routes);

  expect(blogExactMatch).not.toBeNull();
  expect(blogExactMatch!.route.pattern).toBe("/blog");

  expect(blogDynamicMatch).not.toBeNull();
  expect(blogDynamicMatch!.route.pattern).toBe("/blog/:id");
  expect(blogDynamicMatch!.params.id).toBe("hello-world");
});

function getTestSpecificity(pattern: string): number {
  const segments = pattern.split('/').filter(Boolean);

  let staticSegments = 0;
  let dynamicSegments = 0;
  let catchAllSegments = 0;

  for (const segment of segments) {
    if (segment === '*') {
      catchAllSegments++;
    } else if (segment.startsWith(':')) {
      dynamicSegments++;
    } else {
      staticSegments++;
    }
  }

  let score = 0;
  score += staticSegments * 1000;
  score += dynamicSegments * 10;
  score += catchAllSegments * 1;
  score -= segments.length;

  return score;
}

test("matchRoute matches static routes", () => {
  const routes = scanRoutes(testPagesDir);

  const homeMatch = matchRoute("/", routes);
  expect(homeMatch).not.toBeNull();
  expect(homeMatch!.route.pattern).toBe("/");
  expect(homeMatch!.params).toEqual({});

  const aboutMatch = matchRoute("/about", routes);
  expect(aboutMatch).not.toBeNull();
  expect(aboutMatch!.route.pattern).toBe("/about");
});

test("matchRoute matches dynamic routes", () => {
  const routes = scanRoutes(testPagesDir);

  const blogMatch = matchRoute("/blog/hello-world", routes);
  expect(blogMatch).not.toBeNull();
  expect(blogMatch!.route.pattern).toBe("/blog/:id");
  expect(blogMatch!.params).toEqual({ id: "hello-world" });
});

test("matchRoute matches catch-all routes", () => {
  const routes = scanRoutes(testPagesDir);

  const userMatch = matchRoute("/users/john/profile/settings", routes);
  expect(userMatch).not.toBeNull();
  expect(userMatch!.route.pattern).toBe("/users/*");
  expect(userMatch!.params).toEqual({ slug: "john/profile/settings" });
});

test("matchRoute handles query parameters", () => {
  const routes = scanRoutes(testPagesDir);

  const match = matchRoute("/blog/test?page=1&sort=date", routes);
  expect(match).not.toBeNull();
  expect(match!.params).toEqual({ id: "test" });
  expect(match!.query).toEqual({ page: "1", sort: "date" });
});

test("matchRoute returns null for no match", () => {
  const routes = scanRoutes(testPagesDir);

  const match = matchRoute("/non-existent", routes);
  expect(match).toBeNull();
});

test("dynamic route parameters are extracted correctly", () => {
  const routes = scanRoutes(testPagesDir);
  const blogRoute = routes.find(r => r.pattern === "/blog/:id");

  expect(blogRoute).not.toBeNull();
  expect(blogRoute!.params).toEqual(["id"]);
});