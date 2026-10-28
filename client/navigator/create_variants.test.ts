import { expect, test } from "vitest";
import { createVariantName } from "./types.ts";
import { luaStringLiteral } from "./views/pages.ts";

test("a variant prefixes the phrase unless it already starts with the prefix", () => {
  expect(createVariantName({ prefix: "People/" }, "John")).toBe("People/John");
  expect(createVariantName({ prefix: "People/" }, "People/John")).toBe(
    "People/John",
  );
  expect(createVariantName({}, "John")).toBe("John");
});

test("luaStringLiteral picks a long-bracket level the string can't close", () => {
  expect(luaStringLiteral("Person")).toBe("[[Person]]");
  expect(luaStringLiteral("a]]b")).toBe("[=[a]]b]=]");
  // Ending in `]` would close `[[a]` one character early.
  expect(luaStringLiteral("a]")).toBe("[=[a]]=]");
  expect(luaStringLiteral("x]=]y]]")).toBe("[==[x]=]y]]]==]");
});
