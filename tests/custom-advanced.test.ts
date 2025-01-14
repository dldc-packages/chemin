import { expect } from "@std/expect";
import { chemin, type TCheminParam } from "../mod.ts";

Deno.test("custom advanced", () => {
  interface CustomId {
    num: number;
    name: string;
  }

  // match id 45-paul
  function pCustomId<N extends string>(name: N): TCheminParam<N, CustomId> {
    return {
      factory: pCustomId,
      name,
      isEqual: (other) => other.name === name,
      meta: null,
      match: (...all) => {
        const next = all[0];
        const parts = next.split("-");
        if (parts.length !== 2) {
          return { match: false, next: all };
        }
        const num = parseInt(parts[0], 10);
        if (Number.isNaN(num)) {
          return { match: false, next: all };
        }
        return {
          match: true,
          value: { num, name: parts[1] },
          next: all.slice(1),
        };
      },
      serialize: (value) => {
        return `${value.num}-${value.name}`;
      },
      stringify: () => `:${name}(customId)`,
    };
  }

  const path = chemin("item", pCustomId("itemId"));

  const match = path.match("/item/42-etienne");

  expect(match).toEqual({
    params: { itemId: { name: "etienne", num: 42 } },
    rest: [],
    exact: true,
  });
});
