/**
 * Alf Framework - File-System Based Router
 *
 * Leverages Bun's native file system APIs for blazing-fast route discovery.
 * Provides Next.js-style file-based routing with dynamic parameters.
 */

import { readdirSync, statSync } from "fs";
import { join, relative, extname, basename } from "path";
import type { RouteDefinition, MatchedRoute } from "./types";

/**
 * Scans the pages directory and builds route definitions using Bun's file system APIs.
 */
export function scanRoutes(pagesDir: string): RouteDefinition[] {
  const routes: RouteDefinition[] = [];

  function scanDirectory(dir: string, basePath: string = "") {
    try {
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath, join(basePath, entry));
        } else if (stat.isFile()) {
          const ext = extname(entry);
          if (ext === ".tsx" || ext === ".ts") {
            const fileName = basename(entry, ext);
            const route = createRouteFromFile(
              fullPath,
              basePath,
              fileName,
              pagesDir
            );
            if (route) {
              routes.push(route);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dir}:`, error);
    }
  }

  scanDirectory(pagesDir);

  return routes.sort((a, b) => {
    const aSpecificity = getRouteSpecificity(a.pattern);
    const bSpecificity = getRouteSpecificity(b.pattern);
    return bSpecificity - aSpecificity;
  });
}

function createRouteFromFile(
  filePath: string,
  basePath: string,
  fileName: string,
  pagesDir: string
): RouteDefinition | null {
  let pattern = basePath;

  if (fileName === "index") {
    pattern = pattern || "/";
  } else {
    pattern = join(pattern, fileName);
  }

  if (!pattern.startsWith("/")) {
    pattern = "/" + pattern;
  }

  const params: string[] = [];

  pattern = pattern.replace(/\[([^\]]+)\]/g, (match, paramName) => {
    params.push(paramName);
    return ":" + paramName;
  });

  pattern = pattern.replace(/:\.\.\.(.*)/g, (match, paramName) => {
    const index = params.indexOf("..." + paramName);
    if (index > -1) {
      params.splice(index, 1);
      params.push("*" + paramName);
    }
    return "*";
  });

  return {
    filePath: relative(pagesDir, filePath),
    pattern,
    params,
    component: () => import(filePath),
  };
}

function getRouteSpecificity(pattern: string): number {
  const segments = pattern.split("/").filter(Boolean);

  let staticSegments = 0;
  let dynamicSegments = 0;
  let catchAllSegments = 0;

  for (const segment of segments) {
    if (segment === "*") {
      catchAllSegments++;
    } else if (segment.startsWith(":")) {
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

export function matchRoute(
  path: string,
  routes: RouteDefinition[]
): MatchedRoute | null {
  console.log(path, "ovde");
  const [pathname, queryString] = path.split("?");
  const query = parseQueryString(queryString || "");

  for (const route of routes) {
    const params = matchPattern(pathname, route.pattern);
    if (params !== null) {
      return {
        route,
        params,
        query,
      };
    }
  }

  return null;
}

function matchPattern(
  path: string,
  pattern: string
): Record<string, string> | null {
  const pathSegments = path.split("/").filter(Boolean);
  const patternSegments = pattern.split("/").filter(Boolean);

  const catchAllIndex = patternSegments.findIndex((seg) => seg === "*");
  if (catchAllIndex !== -1) {
    if (pathSegments.length < catchAllIndex) return null;

    const params: Record<string, string> = {};

    for (let i = 0; i < catchAllIndex; i++) {
      const pathSeg = pathSegments[i];
      const patternSeg = patternSegments[i];

      if (patternSeg.startsWith(":")) {
        params[patternSeg.slice(1)] = pathSeg;
      } else if (pathSeg !== patternSeg) {
        return null;
      }
    }

    const remaining = pathSegments.slice(catchAllIndex).join("/");
    params.slug = remaining;

    return params;
  }

  if (pathSegments.length !== patternSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternSegments.length; i++) {
    const pathSeg = pathSegments[i];
    const patternSeg = patternSegments[i];

    if (patternSeg.startsWith(":")) {
      params[patternSeg.slice(1)] = pathSeg;
    } else if (pathSeg !== patternSeg) {
      return null;
    }
  }

  return params;
}

function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};

  if (!queryString) return params;

  const pairs = queryString.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    }
  }

  return params;
}
