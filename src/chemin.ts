import { isChemin, matchPart } from "./core.ts";
import { IS_CHEMIN } from "./internal.ts";
import { cheminParamsEqual, pConstant } from "./params.ts";
import type {
  IChemin,
  ISlashOptions,
  TCheminMatchMaybe,
  TCheminParamAny,
  TCreateChemin,
  TIn,
  TPart,
} from "./types.ts";
import { splitPathname } from "./utils.ts";

export const chemin: TCreateChemin = cheminFactory();

export function cheminFactory(
  defaultSerializeOptions: ISlashOptions = {},
): TCreateChemin {
  function createChemin<Args extends readonly TIn[]>(
    ...fragments: Args
  ): IChemin<any> {
    const parts = fragments.map((part) => {
      if (typeof part === "string") {
        return pConstant(part);
      }
      return part;
    });
    let extracted: Array<IChemin> | null = null;
    let flattened: Array<TCheminParamAny> | null = null;

    const chemin: IChemin<any> = {
      [IS_CHEMIN]: true,
      parts,
      serialize: (params: any = null, options: ISlashOptions = {}) =>
        serialize(chemin, params, { ...defaultSerializeOptions, ...options }),
      extract:
        () => (extracted === null ? (extracted = extract(chemin)) : extracted),
      match: (pathname) => match(chemin, pathname),
      matchExact: (pathname) => matchExact(chemin, pathname),
      flatten:
        () => (flattened === null ? (flattened = flatten(chemin)) : flattened),
      stringify: (options: ISlashOptions = {}) =>
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
  chemin: IChemin<Params>,
  pathname: string | Array<string>,
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
  chemin: IChemin<Params>,
  pathname: string | Array<string>,
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
  chemin: IChemin<Params>,
  // deno-lint-ignore ban-types
  params: {} extends Params ? null | undefined : Params,
  options: ISlashOptions = {},
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
  chemin: IChemin<any>,
  options: ISlashOptions,
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
export function flatten(chemin: IChemin): Array<TCheminParamAny> {
  const result: Array<TCheminParamAny> = [];
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
export function extract(chemin: IChemin): Array<IChemin> {
  const result: Array<IChemin> = [chemin];
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
export function equal(left: IChemin, right: IChemin): boolean {
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
