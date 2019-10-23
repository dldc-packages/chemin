import { CheminParams } from './CheminParams';
import { CheminUtils } from './CheminUtils';

export const Chemin = {
  create: createPattern,
  parse: parsePattern,
  serialize: serializePattern,
  stringify: stringifyPattern,
  is: isPattern,
  match: matchPattern,
  matchExact: matchExactPattern,
  extract: extractPatterns,
};

type Part = CheminParams<any, any> | Chemin<any>;

type Params<T> = T extends string
  ? {}
  : T extends Chemin<infer P>
  ? P
  : T extends CheminParams<any, void>
  ? {}
  : T extends CheminParams<infer N, infer P>
  ? { [K in N]: P }
  : {};

const IS_PATTERN = Symbol('IS_PATTERN');

export interface Chemin<Params = any> {
  [IS_PATTERN]: Params;
  parts: Array<Part>;
  serialize: {} extends Params ? (() => string) : (params: Params) => string;
  stringify: () => string;
  match: (pathname: string | Array<string>) => CheminMatchMaybe<Params>;
  matchExact: (pathname: string | Array<string>) => CheminMatchMaybe<Params>;
  extract: () => Array<Chemin>;
}

type In = string | CheminParams<any, any> | Chemin<any>;

function isPattern(maybe: any): maybe is Chemin<any> {
  return maybe && maybe[IS_PATTERN];
}

/**
 const r = num=>Array(num).fill(null).map((v,i)=>i);
 const res = r(10).map(count=> count === 0 ? (`function createPattern(): Chemin<{}>;`) : (`function createPattern<${r(count).map(i=>`P${i} extends In`).join(', ')}>(${r(count).map(i=>`p${i}: P${i}`).join(', ')}): Chemin<${r(count).map(i=>`Params<P${i}>`).join(' & ')}>;`)).map(v=>`// prettier-ignore\n${v}`).join('\n');

 */

// prettier-ignore
function createPattern(): Chemin<{}>;
// prettier-ignore
function createPattern<P0 extends In>(p0: P0): Chemin<Params<P0>>;
// prettier-ignore
function createPattern<P0 extends In, P1 extends In>(p0: P0, p1: P1): Chemin<Params<P0> & Params<P1>>;
// prettier-ignore
function createPattern<P0 extends In, P1 extends In, P2 extends In>(p0: P0, p1: P1, p2: P2): Chemin<Params<P0> & Params<P1> & Params<P2>>;
// prettier-ignore
function createPattern<P0 extends In, P1 extends In, P2 extends In, P3 extends In>(p0: P0, p1: P1, p2: P2, p3: P3): Chemin<Params<P0> & Params<P1> & Params<P2> & Params<P3>>;
// prettier-ignore
function createPattern<P0 extends In, P1 extends In, P2 extends In, P3 extends In, P4 extends In>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4): Chemin<Params<P0> & Params<P1> & Params<P2> & Params<P3> & Params<P4>>;
// prettier-ignore
function createPattern<P0 extends In, P1 extends In, P2 extends In, P3 extends In, P4 extends In, P5 extends In>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5): Chemin<Params<P0> & Params<P1> & Params<P2> & Params<P3> & Params<P4> & Params<P5>>;
// prettier-ignore
function createPattern<P0 extends In, P1 extends In, P2 extends In, P3 extends In, P4 extends In, P5 extends In, P6 extends In>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6): Chemin<Params<P0> & Params<P1> & Params<P2> & Params<P3> & Params<P4> & Params<P5> & Params<P6>>;
// prettier-ignore
function createPattern<P0 extends In, P1 extends In, P2 extends In, P3 extends In, P4 extends In, P5 extends In, P6 extends In, P7 extends In>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7): Chemin<Params<P0> & Params<P1> & Params<P2> & Params<P3> & Params<P4> & Params<P5> & Params<P6> & Params<P7>>;
// prettier-ignore
function createPattern<P0 extends In, P1 extends In, P2 extends In, P3 extends In, P4 extends In, P5 extends In, P6 extends In, P7 extends In, P8 extends In>(p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7, p8: P8): Chemin<Params<P0> & Params<P1> & Params<P2> & Params<P3> & Params<P4> & Params<P5> & Params<P6> & Params<P7> & Params<P8>>;

function createPattern(...fragments: Array<In>): Chemin<any>;
function createPattern(...fragments: Array<In>): Chemin<any> {
  const parts = fragments.map(part => {
    if (typeof part === 'string') {
      return CheminParams.constant(part);
    }
    return part;
  });

  const chemin: Chemin<any> = {
    [IS_PATTERN]: true,
    parts,
    serialize: ((params: any) => serializePattern(chemin, params)) as any,
    extract: () => extractPatterns(chemin),
    match: pathname => matchPattern(chemin, pathname),
    matchExact: pathname => matchExactPattern(chemin, pathname),
    stringify: () => stringifyPattern(chemin),
  };

  return chemin;
}

function parsePattern<Params extends { [key: string]: string } = { [key: string]: string }>(
  str: string
): Chemin<Params> {
  const strParts = CheminUtils.splitPathname(str);
  const parts: Array<Part> = strParts.map(strPart => {
    const isParam = strPart[0] === ':';
    const isOptional = strPart[strPart.length - 1] === '?';
    const name = strPart.slice(isParam ? 1 : 0, isOptional ? -1 : undefined);
    if (isParam === false && isOptional) {
      return CheminParams.optionalConst(name);
    }
    const inner: CheminParams<string, any> = isParam ? CheminParams.string(name) : CheminParams.constant(name);
    return isOptional ? CheminParams.optional(inner) : inner;
  });
  return createPattern(...parts);
}

export interface CheminMatch<Params> {
  params: Params;
  rest: Array<string>;
}

export type CheminMatchMaybe<Params> = CheminMatch<Params> | false;

function matchPattern<Params>(pattern: Chemin<Params>, pathname: string | Array<string>): CheminMatchMaybe<Params> {
  const pathParts = typeof pathname === 'string' ? CheminUtils.splitPathname(pathname) : pathname;
  return matchPart(pattern, pathParts);
}

function matchExactPattern<Params>(pattern: Chemin<Params>, pathname: string | Array<string>): false | Params {
  const match = matchPattern(pattern, pathname);
  if (match && match.rest.length === 0) {
    return match.params;
  }
  return false;
}

function matchPart(part: Part, pathname: Array<string>): CheminMatch<any> | false {
  if (isPattern(part)) {
    const match = matchNextParts(part.parts, pathname);
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

function matchNextParts(parts: Array<Part>, pathname: Array<string>): CheminMatch<any> | false {
  if (parts.length === 0) {
    return { params: {}, rest: pathname };
  }
  const nextPart = parts[0];
  const nextHasParams = isPattern(nextPart) ? true : (nextPart as any).noValue !== true;
  const res = matchPart(nextPart, pathname);
  if (res === false) {
    return false;
  }
  const nextRes = matchNextParts(parts.slice(1), res.rest);
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

function notNull<T>(val: T | null): val is T {
  return val !== null;
}

function serializePattern(pattern: Chemin<{}>): string;
function serializePattern<Params>(pattern: Chemin<Params>, params: Params): string;
function serializePattern(pattern: Chemin<any>, params: any = {}): string {
  const result = pattern.parts
    .map(part => {
      if (isPattern(part)) {
        return serializePattern(part, params).slice(1);
      }
      const value = params[part.name];
      return part.serialize(value);
    })
    .filter(notNull)
    .join('/');
  if (result[0] !== '/') {
    return '/' + result;
  }
  return result;
}

function stringifyPattern(pattern: Chemin<any>): string {
  return (
    '/' +
    pattern.parts
      .map((part): string => {
        if (isPattern(part)) {
          return stringifyPattern(part).slice(1);
        }
        return part.stringify();
      })
      .join('/')
  );
}

function extractPatterns(chemin: Chemin): Array<Chemin> {
  const result: Array<Chemin> = [chemin];
  function traverse(current: Part) {
    if (isPattern(current)) {
      if (result.indexOf(current) === -1) {
        result.push(current);
        current.parts.forEach(traverse);
      }
    }
  }
  chemin.parts.forEach(traverse);
  return result;
}
