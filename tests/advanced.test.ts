import { expect } from "@std/expect";
import {
  chemin,
  matchAllNested,
  pConstant,
  pNumber,
  pOptional,
  prefix,
} from "../mod.ts";

Deno.test("matchAllNested", () => {
  const ROUTES = (() => {
    const home = chemin();
    const posts = chemin(home, "posts");

    const postFragment = chemin("post", pNumber("postId"));

    const post = chemin(home, postFragment);
    const admin = chemin(home, "admin");
    const adminPost = chemin(
      admin,
      postFragment,
      pOptional(pConstant("delete")),
    );

    return {
      home,
      posts,
      post,
      admin: {
        home: admin,
        post: adminPost,
      },
    };
  })();

  function run(pathname: string) {
    const adminPostMatch = ROUTES.admin.post.matchExact(pathname);
    if (adminPostMatch) {
      return `Admin > Post (id: ${adminPostMatch.postId})${
        adminPostMatch.delete ? " > Delete" : ""
      }`;
    }
    const routes = matchAllNested(ROUTES, pathname);
    if (routes.home?.exact) {
      return `Welcome Home`;
    }
    if (routes.post?.exact) {
      return `Post ${routes.post.params.postId}`;
    }
    if (routes.posts?.exact) {
      return `Posts`;
    }
    if (routes.admin.home?.exact) {
      return `Admin`;
    }
    return `Not Found`;
  }

  const results = [
    "/",
    "/admin",
    "/posts",
    "/post/43",
    "/post/2",
    "/admin/post",
    "/admin/post/42",
    "/yolo",
    "/post/egegegd",
    "/admin/post/42/delete",
  ].map((p) => run(p));

  expect(results).toEqual([
    "Welcome Home",
    "Admin",
    "Posts",
    "Post 43",
    "Post 2",
    "Not Found",
    "Admin > Post (id: 42) > Delete",
    "Not Found",
    "Not Found",
    "Admin > Post (id: 42) > Delete",
  ]);
});

Deno.test("prefix", () => {
  const routes = {
    home: chemin(),
    ...prefix("admin", {
      home: chemin("admin"),
      post: chemin("admin", "post", pNumber("postId")),
    }),
  };
  expect(Object.keys(routes)).toEqual(["home", "admin.home", "admin.post"]);
});
