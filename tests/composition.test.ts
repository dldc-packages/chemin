import { expect, test } from "vite-plus/test";
import { chemin, pNumber, pString } from "@dldc/chemin";

test("composition", () => {
  const postFragment = chemin("post", pNumber("postId"));
  const postAdmin = chemin("admin", pString("userId"), postFragment, "edit");

  expect(postAdmin.stringify()).toBe("/admin/:userId/post/:postId(number)/edit");
});
