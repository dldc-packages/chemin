import { isChemin, matchPart } from "./core.ts";
import { IS_CHEMIN } from "./internal.ts";
import { cheminParamsEqual, pConstant } from "./params.ts";
import type {
  TChemin,
  TCheminMatchMaybe,
  TCheminParamAny,
  TCreateChemin,
  TIn,
  TPart,
  TPathname,
  TSlashOptions,
} from "./types.ts";
import { splitPathname } from "./utils.ts";

export const chemin: TCreateChemin = cheminFactory();

/**
 * Factory function to create a chemin function with different default options.
 * It returns a function that works exactly like `chemin` but with a default `serialize` / `stringify` options.
 *
 * ```ts
 * const chemin = cheminFactory({ leadingSlash: false });
 * const user = chemin("user", ":id");
 * user.serialize({ id: 5 }); // "user/5"
 * ```
 *
 * @param defaultSerializeOptions optional and accepts two `boolean` properties:
 * - `leadingSlash` (default `true`): Add a slash at the begining
 * - `trailingSlash` (default: `false`): Add a slash at the end
 * @returns
 */
export function cheminFactory(
  defaultSerializeOptions: TSlashOptions = {},
): TCreateChemin {
  function createChemin<Args extends readonly TIn[]>(
    ...fragments: Args
  ): TChemin<any> {
    const parts = fragments.map((part) => {
      if (typeof part === "string") {
        return pConstant(part);
      }
      return part;
    });
    let extracted: TChemin[] | null = null;
    let flattened: TCheminParamAny[] | null = null;

    const chemin: TChemin<any> = {
      [IS_CHEMIN]: true,
      parts,
      serialize: (params: any = null, options: TSlashOptions = {}) =>
        serialize(chemin, params, { ...defaultSerializeOptions, ...options }),
      extract: () =>
        extracted === null ? (extracted = extract(chemin)) : extracted,
      match: (pathname) => match(chemin, pathname),
      matchExact: (pathname) => matchExact(chemin, pathname),
      flatten: () =>
        flattened === null ? (flattened = flatten(chemin)) : flattened,
      stringify: (options: TSlashOptions = {}) =>
        stringify(chemin, { ...defaultSerializeOptions, ...options }),
    };

    return chemin;
  }

  return createChemin;
}

/**
 * Match a chemin against a pathname and return the params
 */
export function match<Params>(
  chemin: TChemin<Params>,
  pathname: TPathname,
): TCheminMatchMaybe<Params> {
  const pathParts = typeof pathname === "string"
    ? splitPathname(pathname)
    : pathname;
  return matchPart(chemin, pathParts);
}

/**
 * Match a chemin against a pathname and return the params if the match is exact, otherwise null.
 */
export function matchExact<Params>(
  chemin: TChemin<Params>,
  pathname: TPathname,
): null | Params {
  const matchResult = match(chemin, pathname);
  if (matchResult && matchResult.rest.length === 0) {
    return matchResult.params;
  }
  return null;
}

/**
 * Print a chemin from its params.
 */
export function serialize<Params>(
  chemin: TChemin<Params>,
  // deno-lint-ignore ban-types
  params: {} extends Params ? null | undefined : Params,
  options: TSlashOptions = {},
): string {
  const { leadingSlash = true, trailingSlash = false } = options;
  const paramsResolved: any = params === null || params === undefined
    ? {}
    : params;

  const result = chemin.parts
    .map((part) => {
      if (isChemin(part)) {
        return serialize(part, paramsResolved, {
          leadingSlash: false,
          trailingSlash: false,
        });
      }
      const value = paramsResolved[part.name];
      return part.serialize(value);
    })
    .filter((val: string | null): val is string => {
      return val !== null && val.length > 0;
    })
    .join("/");

  const empty = result.length === 0;
  if (empty && (leadingSlash || trailingSlash)) {
    return "/";
  }
  return (leadingSlash ? "/" : "") + result + (trailingSlash ? "/" : "");
}

/**
 * Transform a chemin into a string representation.
 */
export function stringify(
  chemin: TChemin<any>,
  options: TSlashOptions,
): string {
  const { leadingSlash = true, trailingSlash = false } = options;
  const result = chemin.parts
    .map((part): string => {
      if (isChemin(part)) {
        return stringify(part, { leadingSlash: false, trailingSlash: false });
      }
      return part.stringify();
    })
    .filter((val) => {
      return val.length > 0;
    })
    .join("/");
  return (leadingSlash ? "/" : "") + result + (trailingSlash ? "/" : "");
}

/**
 * Flatten a chemin into an array of chemin params.
 */
export function flatten(chemin: TChemin): TCheminParamAny[] {
  const result: TCheminParamAny[] = [];
  function traverse(current: TPart) {
    if (isChemin(current)) {
      result.push(...current.flatten());
    } else {
      result.push(current);
    }
  }
  chemin.parts.forEach(traverse);
  return result;
}

/**
 * Extract all chemins from a chemin including itself.
 */
export function extract(chemin: TChemin): TChemin[] {
  const result: TChemin[] = [chemin];
  function traverse(current: TPart) {
    if (isChemin(current)) {
      if (result.indexOf(current) === -1) {
        result.push(current);
        current.parts.forEach(traverse);
      }
    }
  }
  chemin.parts.forEach(traverse);
  return result;
}

/**
 * Test if two chemins are equal.
 */
export function equal(left: TChemin, right: TChemin): boolean {
  if (left === right) {
    return true;
  }
  const leftFlat = left.flatten();
  const rightFlat = right.flatten();
  if (leftFlat.length !== rightFlat.length) {
    return false;
  }
  return leftFlat.every((param, index) => {
    const other = rightFlat[index];
    return cheminParamsEqual(param, other);
  });
}
