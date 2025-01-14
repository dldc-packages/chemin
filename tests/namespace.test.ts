import { expect } from "@std/expect";
import {
  chemin,
  namespace,
  pConstant,
  pNumber,
  pOptional,
  pString,
} from "../mod.ts";

const ROUTES = (() => {
  const home = chemin();
  const posts = chemin(home, "posts");

  const postFragment = chemin("post", pNumber("postId"));

  const post = chemin(home, postFragment);
  const adminHome = chemin(home, "admin");
  const adminPost = chemin(
    adminHome,
    postFragment,
    pOptional(pConstant("delete")),
  );

  return {
    home,
    posts,
    post,
    adminHome,
    adminPost,
  };
})();

Deno.test("simple namespace", () => {
  const withNamespace = namespace("base", ROUTES);

  expect(Object.keys(withNamespace)).toEqual(Object.keys(ROUTES));

  expect(withNamespace.home.stringify()).toBe("/base");
  expect(withNamespace.posts.stringify()).toBe("/base/posts");
  expect(withNamespace.adminPost.stringify()).toBe(
    "/base/admin/post/:postId(number)/delete?",
  );
  expect(withNamespace.adminPost.match("/base/admin/post/42/delete")).toEqual({
    exact: true,
    params: { delete: { present: true, value: null }, postId: 42 },
    rest: [],
  });
});

Deno.test("namespace with param", () => {
  const withNamespace = namespace(pString("base"), ROUTES);

  expect(Object.keys(withNamespace)).toEqual(Object.keys(ROUTES));
  expect(withNamespace.home.stringify()).toBe("/:base");
  expect(withNamespace.posts.stringify()).toBe("/:base/posts");
  expect(withNamespace.adminPost.stringify()).toBe(
    "/:base/admin/post/:postId(number)/delete?",
  );
  expect(withNamespace.adminPost.match("/yolo/admin/post/42/delete")).toEqual({
    exact: true,
    params: {
      base: "yolo",
      delete: { present: true, value: null },
      postId: 42,
    },
    rest: [],
  });
});

Deno.test("namespace with chemin", () => {
  const withNamespace = namespace(
    chemin("base", pString("org"), pNumber("orgId")),
    ROUTES,
  );

  expect(Object.keys(withNamespace)).toEqual(Object.keys(ROUTES));
  expect(withNamespace.home.stringify()).toBe("/base/:org/:orgId(number)");
  expect(withNamespace.posts.stringify()).toBe(
    "/base/:org/:orgId(number)/posts",
  );
  expect(withNamespace.adminPost.stringify()).toBe(
    "/base/:org/:orgId(number)/admin/post/:postId(number)/delete?",
  );

  expect(
    withNamespace.adminPost.match("/base/yolo/42/admin/post/42/delete"),
  ).toEqual({
    exact: true,
    params: {
      org: "yolo",
      orgId: 42,
      delete: { present: true, value: null },
      postId: 42,
    },
    rest: [],
  });
});
