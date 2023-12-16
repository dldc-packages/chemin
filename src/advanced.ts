import { chemin } from './chemin';
import { isChemin } from './core';
import type { IS_CHEMIN } from './internal';
import type { IChemin, ICheminMatch, TCheminMatchMaybe, TCheminParamAny, TCreateChemin, TParams } from './types';
import { splitPathname } from './utils';

export type TCheminsRecord = Record<string, IChemin>;

export type TCheminsRecordMatches<Chemins extends TCheminsRecord> = {
  [K in keyof Chemins]: TCheminMatchMaybe<TParams<Chemins[K]>>;
};

export type TNestedCheminsRecord = {
  [key: string]: IChemin | TNestedCheminsRecord;
};

export type TNestedCheminsRecordMatches<Chemins extends TNestedCheminsRecord> = {
  [K in keyof Chemins]: Chemins[K] extends IChemin<infer P>
    ? TCheminMatchMaybe<P>
    : Chemins[K] extends TNestedCheminsRecord
      ? TNestedCheminsRecordMatches<Chemins[K]>
      : never;
};

export function matchAll<Chemins extends TCheminsRecord>(
  chemins: Chemins,
  pathname: string | Array<string>,
): TCheminsRecordMatches<Chemins> {
  const pathParts = typeof pathname === 'string' ? splitPathname(pathname) : pathname;
  return Object.keys(chemins).reduce<any>((acc, key) => {
    const chemin = chemins[key];
    acc[key] = chemin.match(pathParts);
    return acc;
  }, {});
}

export function matchAllNested<Chemins extends TNestedCheminsRecord>(
  chemins: Chemins,
  pathname: string | Array<string>,
): TNestedCheminsRecordMatches<Chemins> {
  const pathParts = typeof pathname === 'string' ? splitPathname(pathname) : pathname;
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
  chemin: IChemin<Params>,
  match: TCheminMatchMaybe<Params>,
  part: IChemin<PartialParams>,
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

export type TCheminsNamespaced<Base extends string | TCheminParamAny | IChemin, Chemins extends TCheminsRecord> = {
  [K in keyof Chemins]: IChemin<Chemins[K][typeof IS_CHEMIN] & TParams<Base>>;
};

/**
 * Add a base to a set of chemins
 */
export function namespace<Base extends string | TCheminParamAny | IChemin, Chemins extends TCheminsRecord>(
  base: Base,
  chemins: Chemins,
  create: TCreateChemin = chemin,
): TCheminsNamespaced<Base, Chemins> {
  const result: Record<string, IChemin> = {};
  Object.keys(chemins).forEach((key) => {
    const chemin = chemins[key];
    result[key] = create(base, chemin);
  });
  return result as TCheminsNamespaced<Base, Chemins>;
}

export type Prefixed<Prefix extends string, Children extends Record<string, any>> = {
  [K in keyof Children as `${Prefix}.${K & string}`]: Children[K];
};

export function prefix<Prefix extends string, Children extends Record<string, any>>(
  prefix: Prefix,
  children: Children,
): Prefixed<Prefix, Children> {
  return Object.fromEntries(
    Object.entries(children).map(([key, route]) => {
      return [`${prefix}.${key}`, route];
    }),
  ) as any;
}

export interface IFirstMatchResult {
  chemin: IChemin;
  match: ICheminMatch<any>;
}

/**
 * Match a pathname against a list of chemins and return the first match
 */
export function matchFirst(chemins: Array<IChemin>, pathname: string | Array<string>): IFirstMatchResult | null {
  const pathParts = typeof pathname === 'string' ? splitPathname(pathname) : pathname;
  for (let i = 0; i < chemins.length; i++) {
    const chemin = chemins[i];
    const match = chemin.match(pathParts);
    if (match) {
      return { chemin: chemin, match };
    }
  }
  return null;
}

export interface IFirstExactMatchResult {
  chemin: IChemin;
  params: any;
}

export function matchFirstExact(
  chemins: Array<IChemin>,
  pathname: string | Array<string>,
): IFirstExactMatchResult | null {
  const pathParts = typeof pathname === 'string' ? splitPathname(pathname) : pathname;
  for (let i = 0; i < chemins.length; i++) {
    const chemin = chemins[i];
    const params = chemin.matchExact(pathParts);
    if (params) {
      return { chemin: chemin, params };
    }
  }
  return null;
}
