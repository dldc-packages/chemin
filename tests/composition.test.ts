import { expect } from "@std/expect";
import { chemin, pNumber, pString } from "../mod.ts";

Deno.test("composition", () => {
  const postFragment = chemin("post", pNumber("postId"));
  const postAdmin = chemin("admin", pString("userId"), postFragment, "edit");

  expect(postAdmin.stringify()).toBe(
    "/admin/:userId/post/:postId(number)/edit",
  );
});
