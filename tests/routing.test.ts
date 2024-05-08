import { expect } from "$std/expect/mod.ts";
import { chemin, matchFirst, partialMatch, pString } from "../mod.ts";

Deno.test("routing", () => {
  const workspaceBase = chemin("workspace", pString("tenant"));

  const routes = [
    chemin("home"), // home
    chemin("settings"), // settings
    chemin(workspaceBase, "home"), // workspace home
    chemin(workspaceBase, "settings"), // workspace settings
  ];

  function app(pathname: string) {
    const route = matchFirst(routes, pathname);
    if (!route) {
      return { route: null };
    }
    const { chemin, match } = route;
    // extract the tenant from the workspace if it's a workspace route
    const params = partialMatch(chemin, match, workspaceBase);
    // params is typed as { tenant: string } | null
    if (params) {
      return { tenant: params.tenant, route: chemin.stringify() };
    }
    return { route: chemin.stringify() };
  }

  const results = [
    "/home",
    "/yolo",
    "/settings",
    "/workspace/yolo/settings",
    "/workspace/yolo/home",
    "/workspace/yolo/yolo",
  ].map((pathname) => app(pathname));

  expect(results).toEqual([
    { route: "/home" },
    { route: null },
    { route: "/settings" },
    { route: "/workspace/:tenant/settings", tenant: "yolo" },
    { route: "/workspace/:tenant/home", tenant: "yolo" },
    { route: null },
  ]);
});
