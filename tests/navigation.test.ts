import { test, expect } from "bun:test";
import { Link, navigate, currentPath } from "../src/router/navigation";

test("Link component creates anchor element", () => {
  const linkElement = Link({ href: "/about", children: "About" });

  expect(linkElement.type).toBe("a");
  expect(linkElement.props.href).toBe("/about");
  expect(linkElement.children).toEqual(["About"]);
});

test("Link component preserves additional props", () => {
  const linkElement = Link({
    href: "/about",
    className: "nav-link",
    "data-testid": "about-link",
    children: "About"
  });

  expect(linkElement.props.className).toBe("nav-link");
  expect(linkElement.props["data-testid"]).toBe("about-link");
});

test("navigate updates current path", () => {
  const initialPath = currentPath();
  navigate("/new-path");

  expect(currentPath()).toBe("/new-path");

  // Reset for other tests
  navigate(initialPath);
});