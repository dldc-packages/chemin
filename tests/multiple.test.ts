import { expect } from "@std/expect";
import { chemin, pMultiple, pString } from "../mod.ts";

Deno.test("multiple allow zero", () => {
  const c = chemin(pMultiple(pString("categories")));
  expect(c.matchExact("/")).toEqual({ categories: [] });
  expect(c.matchExact("/foo/bar")).toEqual({ categories: ["foo", "bar"] });
});

Deno.test("multiple atLeastOne", () => {
  const c = chemin(pMultiple(pString("categories"), true));
  expect(c.matchExact("/")).toBe(null);
  expect(c.matchExact("/foo/bar")).toEqual({ categories: ["foo", "bar"] });
});
