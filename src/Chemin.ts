import { CheminParam, cheminParamsEqual, type TCheminParam, type TCheminParamAny } from './CheminParam';
import { splitPathname } from './utils';

const defaultCreateChemin = createCreator();

export const Chemin = {
  createCreator,
  create: defaultCreateChemin,
  parse: parseChemin,
  isChemin,
};

type CreateChemin = typeof defaultCreateChemin;

type Part = TCheminParamAny | IChemin<any>;

type Params<T> = T extends string
  ? {}
  : T extends IChemin<infer P>
  ? P
  : T extends TCheminParam<any, void, any>
  ? {}
  : T extends TCheminParam<infer N, infer P, any>
  ? { [K in N]: P }
  : {};

const IS_CHEMIN = Symbol.for('IS_CHEMIN_INTERNAL');

interface SlashOptions {
  leadingSlash?: boolean;
  trailingSlash?: boolean;
}

export interface IChemin<Params = any> {
  [IS_CHEMIN]: Params;
  parts: Array<Part>;
  serialize: {} extends Params
    ? (params?: null, options?: SlashOptions) => string
    : (params: Params, options?: SlashOptions) => string;
  match: (pathname: string | Array<string>) => TCheminMatchMaybe<Params>;
  matchExact: (pathname: string | Array<string>) => Params | false;
  extract: () => Array<IChemin>;
  flatten: () => Array<TCheminParamAny>;
  equal: (other: IChemin) => boolean;
  stringify: (options?: SlashOptions) => string;
}

type In = string | TCheminParamAny | IChemin<any>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function isChemin(maybe: any): maybe is IChemin<any> {
  return maybe && maybe[IS_CHEMIN];
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function createCreator(defaultSerializeOptions: SlashOptions = {}) {
  /**
   *  const r = num=>Array(num).fill(null).map((v,i)=>i);
   *  const res = r(10).map(count=> count === 0 ? (`function createChemin(): IChemin<{}>;`) : (`function createChemin<${r(count).map(i=>`P${i} extends In`).join(', ')}>(${r(count).map(i=>`p${i}: P${i}`).join(', ')}): IChemin<${r(count).map(i=>`Params<P${i}>`).join(' & ')}>;`)).map(v=>`// prettier-ignore\n${v}`).join('\n');
   */

  // prettier-ignore
  function createChemin(): IChemin<{}>;
  // prettier-ignore
  function createChemin<P0 extends In>(p0: P0): IChemin<Params<P0>>;
  // prettier-ignore
  function createChemin<P0 extends In, P1 extends In>(p0: P0, p1: P1): IChemin<Params<P0> & Params<P1>>;
  // prettier-ignore
  function createChemin<P0 extends In, P1 extends In, P2 extends In>(p0: P0, p1: P1, p2: P2): IChemin<Params<P0> & Params<P1> & Params<P2>>;
  // prettier-ignore
  function createChemin<P0 extends In, P1 extends In, P2 extends In, P3 extends In>(p0: P0, p1: P1, p2: P2, p3: P3): IChemin<Params<P0> & Params<P1> & Params<P2> & Params<P3>>;
  // prettier-ignore
  function createChemin<P0 extends In, P1 extends In, P2 extends In, P3 extends In, P4 extends In>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4): IChemin<Params<P0> & Params<P1> & Params<P2> & Params<P3> & Params<P4>>;
  // prettier-ignore
  function createChemin<P0 extends In, P1 extends In, P2 extends In, P3 extends In, P4 extends In, P5 extends In>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5): IChemin<Params<P0> & Params<P1> & Params<P2> & Params<P3> & Params<P4> & Params<P5>>;
  // prettier-ignore
  function createChemin<P0 extends In, P1 extends In, P2 extends In, P3 extends In, P4 extends In, P5 extends In, P6 extends In>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6): IChemin<Params<P0> & Params<P1> & Params<P2> & Params<P3> & Params<P4> & Params<P5> & Params<P6>>;
  // prettier-ignore
  function createChemin<P0 extends In, P1 extends In, P2 extends In, P3 extends In, P4 extends In, P5 extends In, P6 extends In, P7 extends In>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7): IChemin<Params<P0> & Params<P1> & Params<P2> & Params<P3> & Params<P4> & Params<P5> & Params<P6> & Params<P7>>;
  // prettier-ignore
  function createChemin<P0 extends In, P1 extends In, P2 extends In, P3 extends In, P4 extends In, P5 extends In, P6 extends In, P7 extends In, P8 extends In>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7, p8: P8): IChemin<Params<P0> & Params<P1> & Params<P2> & Params<P3> & Params<P4> & Params<P5> & Params<P6> & Params<P7> & Params<P8>>;

  function createChemin(...fragments: Array<In>): IChemin<any>;
  function createChemin(...fragments: Array<In>): IChemin<any> {
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
      serialize: (params: any = null, options: SlashOptions = {}) =>
        serializeChemin(chemin, params, {
          ...defaultSerializeOptions,
          ...options,
        }),
      extract: () => (extracted === null ? (extracted = extractChemins(chemin)) : extracted),
      match: (pathname) => matchChemin(chemin, pathname),
      matchExact: (pathname) => matchExactChemin(chemin, pathname),
      flatten: () => (flattened === null ? (flattened = flattenChemins(chemin)) : flattened),
      equal: (other) => cheminsEqual(chemin, other),
      stringify: (options: SlashOptions = {}) =>
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
  creator: CreateChemin = defaultCreateChemin,
): IChemin<Params> {
  const strParts = splitPathname(str);
  const parts: Array<Part> = strParts.map((strPart) => {
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

export interface ICheminMatch<Params> {
  params: Params;
  rest: Array<string>;
}

export type TCheminMatchMaybe<Params> = ICheminMatch<Params> | false;

function matchChemin<Params>(chemin: IChemin<Params>, pathname: string | Array<string>): TCheminMatchMaybe<Params> {
  const pathParts = typeof pathname === 'string' ? splitPathname(pathname) : pathname;
  return matchPart(chemin, pathParts);
}

function matchExactChemin<Params>(chemin: IChemin<Params>, pathname: string | Array<string>): false | Params {
  const match = matchChemin(chemin, pathname);
  if (match && match.rest.length === 0) {
    return match.params;
  }
  return false;
}

function matchPart(part: Part, pathname: Array<string>): ICheminMatch<any> | false {
  if (isChemin(part)) {
    const match = matchParts(part.parts, pathname);
    if (match === false) {
      return false;
    }
    return {
      rest: match.rest,
      params: match.params,
    };
  }
  const res = part.match(...pathname);
  if (res.match === false) {
    return false;
  }
  return {
    params: {
      [part.name]: res.value,
    },
    rest: res.next,
  };
}

function matchParts(parts: Array<Part>, pathname: Array<string>): ICheminMatch<any> | false {
  if (parts.length === 0) {
    return { params: {}, rest: pathname };
  }
  const nextPart = parts[0];
  const nextHasParams = isChemin(nextPart) ? true : !('noValue' in nextPart) || nextPart.noValue !== true;
  const res = matchPart(nextPart, pathname);
  if (res === false) {
    return false;
  }
  const nextRes = matchParts(parts.slice(1), res.rest);
  if (nextRes === false) {
    return false;
  }
  return {
    rest: nextRes.rest,
    params: {
      ...(nextHasParams ? res.params : {}),
      ...nextRes.params,
    },
  };
}

function serializeChemin<Params>(
  chemin: IChemin<Params>,
  params: {} extends Params ? null | undefined : Params,
  options: SlashOptions,
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

function cheminStringify(chemin: IChemin<any>, options: SlashOptions): string {
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
  function traverse(current: Part) {
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
  function traverse(current: Part) {
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

export function cheminsEqual(left: IChemin, right: IChemin): boolean {
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
