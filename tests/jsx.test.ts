import { test, expect } from "bun:test";
import { h, Fragment } from "../src/core/index";

test("h function creates elements", () => {
  const element = h("div", { id: "test" }, "Hello World");

  expect(element.type).toBe("div");
  expect(element.props.id).toBe("test");
  expect(element.children).toEqual(["Hello World"]);
});

test("h function handles nested elements", () => {
  const child = h("span", null, "Child");
  const parent = h("div", null, child);

  expect(parent.children[0]).toBe(child);
});

test("h function flattens arrays", () => {
  const element = h("div", null, ...["Hello", " ", "World"]);

  expect(element.children).toEqual(["Hello", " ", "World"]);
});

test("h function handles null and undefined children", () => {
  const element = h("div", null, null, undefined, "text");

  expect(element.children).toEqual(["text"]);
});

test("h function handles boolean children", () => {
  const element = h("div", null, true, false, "text");

  expect(element.children).toEqual(["text"]);
});

test("Fragment creates fragment element", () => {
  const fragment = Fragment({ children: ["Hello", "World"] });

  expect(fragment.type).toBe("alf-fragment");
  expect(fragment.children).toEqual(["Hello", "World"]);
});

test("h function handles component functions", () => {
  const MyComponent = (props: any) => h("div", null, `Hello ${props.name}`);
  const element = h(MyComponent, { name: "Alf" });

  expect(element.type).toBe(MyComponent);
  expect(element.props.name).toBe("Alf");
});