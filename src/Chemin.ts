import { CheminParam, cheminParamsEqual, type TCheminParam, type TCheminParamAny } from './CheminParam';
import { IS_CHEMIN } from './internal';
import { splitPathname } from './utils';

const defaultCreateChemin = createCreator();

export const Chemin = {
  createCreator,
  create: defaultCreateChemin,
  parse: parseChemin,
  isChemin,
  matchAll: matchAllChemins,
  matchAllNested: matchAllCheminsNested,
  equal: cheminsEqual,
  partialMatch,
};

export interface ICheminMatch<Params> {
  params: Params;
  rest: Array<string>;
  exact: boolean;
}

export type TCheminMatchMaybe<Params> = ICheminMatch<Params> | null;

export type TCreateChemin = typeof defaultCreateChemin;

export type TPart = TCheminParamAny | IChemin<any>;

export type TEmptyObject = Record<never, never>;

export type TParams<T> = T extends string
  ? TEmptyObject
  : T extends IChemin<infer P>
  ? P
  : T extends TCheminParam<any, void, any>
  ? TEmptyObject
  : T extends TCheminParam<infer N, infer P, any>
  ? { [K in N]: P }
  : TEmptyObject;

export interface ISlashOptions {
  leadingSlash?: boolean;
  trailingSlash?: boolean;
}

export interface IChemin<Params = any> {
  [IS_CHEMIN]: Params;
  parts: ReadonlyArray<TPart>;
  serialize: TEmptyObject extends Params
    ? (params?: null, options?: ISlashOptions) => string
    : (params: Params, options?: ISlashOptions) => string;
  match: (pathname: string | Array<string>) => TCheminMatchMaybe<Params>;
  matchExact: (pathname: string | Array<string>) => Params | null;
  extract: () => Array<IChemin>;
  flatten: () => Array<TCheminParamAny>;
  equal: (other: IChemin) => boolean;
  stringify: (options?: ISlashOptions) => string;
}

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

type TIn = string | TCheminParamAny | IChemin<any>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function isChemin(maybe: any): maybe is IChemin<any> {
  return maybe && maybe[IS_CHEMIN];
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function createCreator(defaultSerializeOptions: ISlashOptions = {}) {
  /**
   *  const r = num=>Array(num).fill(null).map((v,i)=>i);
   *  const res = r(10).map(count=> count === 0 ? (`function createChemin(): IChemin<{}>;`) : (`function createChemin<${r(count).map(i=>`P${i} extends In`).join(', ')}>(${r(count).map(i=>`p${i}: P${i}`).join(', ')}): IChemin<${r(count).map(i=>`Params<P${i}>`).join(' & ')}>;`)).map(v=>`// prettier-ignore\n${v}`).join('\n');
   */

  // prettier-ignore
  function createChemin(): IChemin<TEmptyObject>;
  // prettier-ignore
  function createChemin<P0 extends TIn>(p0: P0): IChemin<TParams<P0>>;
  // prettier-ignore
  function createChemin<P0 extends TIn, P1 extends TIn>(p0: P0, p1: P1): IChemin<TParams<P0> & TParams<P1>>;
  // prettier-ignore
  function createChemin<P0 extends TIn, P1 extends TIn, P2 extends TIn>(p0: P0, p1: P1, p2: P2): IChemin<TParams<P0> & TParams<P1> & TParams<P2>>;
  // prettier-ignore
  function createChemin<P0 extends TIn, P1 extends TIn, P2 extends TIn, P3 extends TIn>(p0: P0, p1: P1, p2: P2, p3: P3): IChemin<TParams<P0> & TParams<P1> & TParams<P2> & TParams<P3>>;
  // prettier-ignore
  function createChemin<P0 extends TIn, P1 extends TIn, P2 extends TIn, P3 extends TIn, P4 extends TIn>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4): IChemin<TParams<P0> & TParams<P1> & TParams<P2> & TParams<P3> & TParams<P4>>;
  // prettier-ignore
  function createChemin<P0 extends TIn, P1 extends TIn, P2 extends TIn, P3 extends TIn, P4 extends TIn, P5 extends TIn>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5): IChemin<TParams<P0> & TParams<P1> & TParams<P2> & TParams<P3> & TParams<P4> & TParams<P5>>;
  // prettier-ignore
  function createChemin<P0 extends TIn, P1 extends TIn, P2 extends TIn, P3 extends TIn, P4 extends TIn, P5 extends TIn, P6 extends TIn>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6): IChemin<TParams<P0> & TParams<P1> & TParams<P2> & TParams<P3> & TParams<P4> & TParams<P5> & TParams<P6>>;
  // prettier-ignore
  function createChemin<P0 extends TIn, P1 extends TIn, P2 extends TIn, P3 extends TIn, P4 extends TIn, P5 extends TIn, P6 extends TIn, P7 extends TIn>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7): IChemin<TParams<P0> & TParams<P1> & TParams<P2> & TParams<P3> & TParams<P4> & TParams<P5> & TParams<P6> & TParams<P7>>;
  // prettier-ignore
  function createChemin<P0 extends TIn, P1 extends TIn, P2 extends TIn, P3 extends TIn, P4 extends TIn, P5 extends TIn, P6 extends TIn, P7 extends TIn, P8 extends TIn>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7, p8: P8): IChemin<TParams<P0> & TParams<P1> & TParams<P2> & TParams<P3> & TParams<P4> & TParams<P5> & TParams<P6> & TParams<P7> & TParams<P8>>;

  function createChemin(...fragments: Array<TIn>): IChemin<any>;
  function createChemin(...fragments: Array<TIn>): IChemin<any> {
    const parts = fragments.map((part) => {
      if (typeof part === 'string') {
        return CheminParam.constant(part);
      }
      return part;
    });
    let extracted: Array<IChemin> | null = null;
    let flattened: Array<TCheminParamAny> | null = null;

    const chemin: IChemin<any> = {
      [IS_CHEMIN]: true,
      parts,
      serialize: (params: any = null, options: ISlashOptions = {}) =>
        serializeChemin(chemin, params, {
          ...defaultSerializeOptions,
          ...options,
        }),
      extract: () => (extracted === null ? (extracted = extractChemins(chemin)) : extracted),
      match: (pathname) => matchChemin(chemin, pathname),
      matchExact: (pathname) => matchExactChemin(chemin, pathname),
      flatten: () => (flattened === null ? (flattened = flattenChemins(chemin)) : flattened),
      equal: (other) => cheminsEqual(chemin, other),
      stringify: (options: ISlashOptions = {}) =>
        cheminStringify(chemin, {
          ...defaultSerializeOptions,
          ...options,
        }),
    };

    return chemin;
  }

  return createChemin;
}

function parseChemin<Params extends { [key: string]: string } = { [key: string]: string }>(
  str: string,
  creator: TCreateChemin = defaultCreateChemin,
): IChemin<Params> {
  const strParts = splitPathname(str);
  const parts: Array<TPart> = strParts.map((strPart) => {
    const isParam = strPart[0] === ':';
    const isOptional = strPart[strPart.length - 1] === '?';
    const name = strPart.slice(isParam ? 1 : 0, isOptional ? -1 : undefined);
    if (isParam === false && isOptional) {
      return CheminParam.optionalConst(name);
    }
    const inner: TCheminParam<string, any> = isParam ? CheminParam.string(name) : CheminParam.constant(name);
    return isOptional ? CheminParam.optional(inner) : inner;
  });
  return creator(...parts);
}

function matchChemin<Params>(chemin: IChemin<Params>, pathname: string | Array<string>): TCheminMatchMaybe<Params> {
  const pathParts = typeof pathname === 'string' ? splitPathname(pathname) : pathname;
  return matchPart(chemin, pathParts);
}

function matchExactChemin<Params>(chemin: IChemin<Params>, pathname: string | Array<string>): null | Params {
  const match = matchChemin(chemin, pathname);
  if (match && match.rest.length === 0) {
    return match.params;
  }
  return null;
}

function matchPart(part: TPart, pathname: Array<string>): ICheminMatch<any> | null {
  if (isChemin(part)) {
    const match = matchParts(part.parts, pathname);
    if (match === null) {
      return null;
    }
    return {
      rest: match.rest,
      params: match.params,
      exact: match.rest.length === 0,
    };
  }
  const res = part.match(...pathname);
  if (res.match === false) {
    return null;
  }
  return {
    params: {
      [part.name]: res.value,
    },
    rest: res.next,
    exact: res.next.length === 0,
  };
}

function matchParts(parts: ReadonlyArray<TPart>, pathname: Array<string>): ICheminMatch<any> | null {
  if (parts.length === 0) {
    return { params: {}, rest: pathname, exact: pathname.length === 0 };
  }
  const nextPart = parts[0];
  const nextHasParams = isChemin(nextPart) ? true : !('noValue' in nextPart) || nextPart.noValue !== true;
  const res = matchPart(nextPart, pathname);
  if (res === null) {
    return null;
  }
  const nextRes = matchParts(parts.slice(1), res.rest);
  if (nextRes === null) {
    return null;
  }
  return {
    rest: nextRes.rest,
    exact: nextRes.exact,
    params: {
      ...(nextHasParams ? res.params : {}),
      ...nextRes.params,
    },
  };
}

function serializeChemin<Params>(
  chemin: IChemin<Params>,
  params: {} extends Params ? null | undefined : Params,
  options: ISlashOptions,
): string {
  const { leadingSlash = true, trailingSlash = false } = options;
  const paramsResolved: any = params === null || params === undefined ? {} : params;

  const result = chemin.parts
    .map((part) => {
      if (isChemin(part)) {
        return serializeChemin(part, paramsResolved, { leadingSlash: false, trailingSlash: false });
      }
      const value = paramsResolved[part.name];
      return part.serialize(value);
    })
    .filter((val: string | null): val is string => {
      return val !== null && val.length > 0;
    })
    .join('/');

  const empty = result.length === 0;
  if (empty && (leadingSlash || trailingSlash)) {
    return '/';
  }
  return (leadingSlash ? '/' : '') + result + (trailingSlash ? '/' : '');
}

function cheminStringify(chemin: IChemin<any>, options: ISlashOptions): string {
  const { leadingSlash = true, trailingSlash = false } = options;
  const result = chemin.parts
    .map((part): string => {
      if (isChemin(part)) {
        return cheminStringify(part, { leadingSlash: false, trailingSlash: false });
      }
      return part.stringify();
    })
    .filter((val) => {
      return val.length > 0;
    })
    .join('/');
  return (leadingSlash ? '/' : '') + result + (trailingSlash ? '/' : '');
}

function flattenChemins(chemin: IChemin): Array<TCheminParamAny> {
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

function extractChemins(chemin: IChemin): Array<IChemin> {
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

function cheminsEqual(left: IChemin, right: IChemin): boolean {
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

function matchAllChemins<Chemins extends TCheminsRecord>(
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

function matchAllCheminsNested<Chemins extends TNestedCheminsRecord>(
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
    acc[key] = matchAllCheminsNested(chemin, pathParts);
    return acc;
  }, {});
}

function partialMatch<Params, ParatialParams>(
  chemin: IChemin<Params>,
  match: TCheminMatchMaybe<Params>,
  part: IChemin<ParatialParams>,
): null | ParatialParams {
  if (!match) {
    return null;
  }
  const contains = chemin.extract().includes(part);
  if (contains === false) {
    return null;
  }
  return match.params as unknown as ParatialParams;
}
