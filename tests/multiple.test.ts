import { expect, test } from "vite-plus/test";
import { chemin, pMultiple, pString } from "@dldc/chemin";

test("multiple allow zero", () => {
  const c = chemin(pMultiple(pString("categories")));
  expect(c.matchExact("/")).toEqual({ categories: [] });
  expect(c.matchExact("/foo/bar")).toEqual({ categories: ["foo", "bar"] });
});

test("multiple atLeastOne", () => {
  const c = chemin(pMultiple(pString("categories"), true));
  expect(c.matchExact("/")).toBe(null);
  expect(c.matchExact("/foo/bar")).toEqual({ categories: ["foo", "bar"] });
});
