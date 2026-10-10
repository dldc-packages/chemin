import { expect, test } from "vite-plus/test";
import { chemin, pNumber, pOptionalConst } from "@dldc/chemin";

test("create", () => {
  const c = chemin("admin", "post", pNumber("postId"), pOptionalConst("delete"));

  expect(c.match("/no/valid")).toBe(null);
  expect(c.match("/admin/post/45")).toEqual({
    rest: [],
    params: { postId: 45, delete: false },
    exact: true,
  });
});
