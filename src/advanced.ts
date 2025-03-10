import { chemin } from "./chemin.ts";
import { isChemin } from "./core.ts";
import type { IS_CHEMIN } from "./internal.ts";
import type {
  TChemin,
  TCheminMatch,
  TCheminMatchMaybe,
  TCheminParamAny,
  TCreateChemin,
  TParams,
  TPathname,
} from "./types.ts";
import { splitPathname } from "./utils.ts";

export type TCheminsRecord = Record<string, TChemin>;

export type TCheminsRecordMatches<Chemins extends TCheminsRecord> = {
  [K in keyof Chemins]: TCheminMatchMaybe<TParams<Chemins[K]>>;
};

export type TNestedCheminsRecord = {
  [key: string]: TChemin | TNestedCheminsRecord;
};

export type TNestedCheminsRecordMatches<Chemins extends TNestedCheminsRecord> =
  {
    [K in keyof Chemins]: Chemins[K] extends TChemin<infer P>
      ? TCheminMatchMaybe<P>
      : Chemins[K] extends TNestedCheminsRecord
        ? TNestedCheminsRecordMatches<Chemins[K]>
      : never;
  };

export function matchAll<Chemins extends TCheminsRecord>(
  chemins: Chemins,
  pathname: string | readonly string[],
): TCheminsRecordMatches<Chemins> {
  const pathParts = typeof pathname === "string"
    ? splitPathname(pathname)
    : pathname;
  return Object.keys(chemins).reduce<any>((acc, key) => {
    const chemin = chemins[key];
    acc[key] = chemin.match(pathParts);
    return acc;
  }, {});
}

export function matchAllNested<Chemins extends TNestedCheminsRecord>(
  chemins: Chemins,
  pathname: TPathname,
): TNestedCheminsRecordMatches<Chemins> {
  const pathParts = typeof pathname === "string"
    ? splitPathname(pathname)
    : pathname;
  return Object.keys(chemins).reduce<any>((acc, key) => {
    const chemin = chemins[key];
    if (isChemin(chemin)) {
      acc[key] = chemin.match(pathParts);
      return acc;
    }
    acc[key] = matchAllNested(chemin, pathParts);
    return acc;
  }, {});
}

export function partialMatch<Params, PartialParams>(
  chemin: TChemin<Params>,
  match: TCheminMatchMaybe<Params>,
  part: TChemin<PartialParams>,
): null | PartialParams {
  if (!match) {
    return null;
  }
  const contains = chemin.extract().includes(part);
  if (contains === false) {
    return null;
  }
  return match.params as unknown as PartialParams;
}

export type TCheminsNamespaced<
  Base extends string | TCheminParamAny | TChemin,
  Chemins extends TCheminsRecord,
> = {
  [K in keyof Chemins]: TChemin<Chemins[K][typeof IS_CHEMIN] & TParams<Base>>;
};

/**
 * Add a base to a set of chemins
 */
export function namespace<
  Base extends string | TCheminParamAny | TChemin,
  Chemins extends TCheminsRecord,
>(
  base: Base,
  chemins: Chemins,
  create: TCreateChemin = chemin,
): TCheminsNamespaced<Base, Chemins> {
  const result: Record<string, TChemin> = {};
  Object.keys(chemins).forEach((key) => {
    const chemin = chemins[key];
    result[key] = create(base, chemin);
  });
  return result as TCheminsNamespaced<Base, Chemins>;
}

export type Prefixed<
  Prefix extends string,
  Children extends Record<string, any>,
> = {
  [K in keyof Children as `${Prefix}.${K & string}`]: Children[K];
};

export function prefix<
  Prefix extends string,
  Children extends Record<string, any>,
>(prefix: Prefix, children: Children): Prefixed<Prefix, Children> {
  return Object.fromEntries(
    Object.entries(children).map(([key, route]) => {
      return [`${prefix}.${key}`, route];
    }),
  ) as any;
}

export interface TFirstMatchResult {
  chemin: TChemin;
  match: TCheminMatch<any>;
}

/**
 * Match a pathname against a list of chemins and return the first match
 */
export function matchFirst(
  chemins: readonly TChemin[],
  pathname: TPathname,
): TFirstMatchResult | null {
  const pathParts = typeof pathname === "string"
    ? splitPathname(pathname)
    : pathname;
  for (let i = 0; i < chemins.length; i++) {
    const chemin = chemins[i];
    const match = chemin.match(pathParts);
    if (match) {
      return { chemin: chemin, match };
    }
  }
  return null;
}

export interface TFirstExactMatchResult {
  chemin: TChemin;
  params: any;
}

export function matchFirstExact(
  chemins: readonly TChemin[],
  pathname: TPathname,
): TFirstExactMatchResult | null {
  const pathParts = typeof pathname === "string"
    ? splitPathname(pathname)
    : pathname;
  for (let i = 0; i < chemins.length; i++) {
    const chemin = chemins[i];
    const params = chemin.matchExact(pathParts);
    if (params) {
      return { chemin: chemin, params };
    }
  }
  return null;
}
