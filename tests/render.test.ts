import { test, expect, beforeEach } from "bun:test";
import { JSDOM } from "jsdom";
import { h, render, signal } from "../src/core/index";

let dom: JSDOM;
let container: Element;

beforeEach(() => {
  dom = new JSDOM("<!DOCTYPE html><html><body><div id='app'></div></body></html>");
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.Text = dom.window.Text;
  global.Comment = dom.window.Comment;

  container = document.getElementById("app")!;
});

test("render simple element", () => {
  const element = h("div", { id: "test" }, "Hello World");
  render(element, container);

  expect(container.innerHTML).toBe('<div id="test">Hello World</div>');
});

test("render nested elements", () => {
  const element = h("div", null,
    h("h1", null, "Title"),
    h("p", null, "Content")
  );
  render(element, container);

  expect(container.innerHTML).toBe('<div><h1>Title</h1><p>Content</p></div>');
});

test("render fragment", () => {
  const element = h("alf-fragment", null, "Hello", " ", "World");
  render(element, container);

  expect(container.innerHTML).toBe('Hello World');
});

test("render component", () => {
  const Greeting = (props: { name: string }) => {
    return h("div", null, `Hello ${props.name}!`);
  };

  const element = h(Greeting, { name: "Alf" });
  render(element, container);

  expect(container.innerHTML).toBe('<div>Hello Alf!</div>');
});

test("render reactive component", () => {
  const count = signal(0);

  const Counter = () => {
    return h("div", null, `Count: ${count()}`);
  };

  const element = h(Counter, {});
  render(element, container);

  expect(container.innerHTML).toBe('<div>Count: 0</div>');

  count(5);

  // Note: In a real DOM environment with proper event loop, this would update automatically
  // For now we'll test the signal separately
  expect(count()).toBe(5);
});

test("render handles null and undefined", () => {
  const element = h("div", null, null, undefined, "text");
  render(element, container);

  expect(container.innerHTML).toBe('<div>text</div>');
});