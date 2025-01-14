import { expect } from "@std/expect";
import { chemin, pInteger, pOptional } from "../mod.ts";

Deno.test("optional", () => {
  const c = chemin(pOptional(pInteger("myInt")));
  expect(c.matchExact("/42")).toEqual({ myInt: { present: true, value: 42 } });
  expect(c.matchExact("/")).toEqual({ myInt: { present: false } });
});
