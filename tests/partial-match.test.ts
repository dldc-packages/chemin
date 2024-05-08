import { expect } from "$std/expect/mod.ts";
import { chemin, partialMatch, pString } from "../mod.ts";

Deno.test("Example", () => {
  const workspace = chemin("workspace", pString("tenant"));

  const home = chemin("home");
  const workspaceHome = chemin(workspace, "home");
  const workspaceSettings = chemin(workspace, "settings");

  const match1 = partialMatch(
    workspaceHome,
    workspaceHome.match("/workspace/123/home"),
    workspace,
  );
  // match1 is typed as { tenant: string } | null
  expect(match1).toMatchObject({ tenant: "123" });

  const match2 = partialMatch(
    workspaceSettings,
    workspaceSettings.match("/workspace/123/settings"),
    workspace,
  );
  expect(match2).toMatchObject({ tenant: "123" });

  const match3 = partialMatch(home, home.match("/home"), workspace);
  expect(match3).toBe(null);
});

Deno.test("partial match", () => {
  const userPart = chemin("user", pString("id"));

  const route1 = chemin("admin", pString("id"), userPart, "demo");
  const route2 = chemin(userPart, "demo", pString("action"));
  const route3 = chemin("admin", pString("id"), "user", pString("id"));

  const route1Match = route1.match("/admin/123/user/456/demo");
  const route2Match = route2.match("/user/123/demo/edit");
  const route3Match = route3.match("/admin/123/user/456");
  const route3Match2 = route3.match("/yolo");

  expect(partialMatch(route1, route1Match, userPart)).toMatchObject({
    id: "456",
  });
  expect(partialMatch(route2, route2Match, userPart)).toMatchObject({
    id: "123",
  });
  expect(partialMatch(route3, route3Match, userPart)).toBe(null);
  expect(partialMatch(route3, route3Match2, userPart)).toBe(null);
});
