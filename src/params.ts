import type { TEmptyObject } from './chemin.temp';

export const CheminParam = {
  number,
  integer,
  string,
  constant,
  optional,
  optionalConst,
  optionalString,
  multiple,
};

export type TPartMatchResult<T> =
  | { match: false }
  | { match: true; value: T extends void ? null : T; next: Array<string> };
export type TPartMatch<T> = (...parts: Array<string>) => TPartMatchResult<T>;
export type TPartSerialize<T> = (value: T) => string | null;
export type TPartIsEqual<N extends string, T, Meta> = (other: TCheminParam<N, T, Meta>) => boolean;
export type TPartStringify = () => string;

export interface ICheminParamBase<N extends string, T, Meta> {
  name: N;
  match: TPartMatch<T>;
  stringify: TPartStringify;
  serialize: TPartSerialize<T>;
  meta: Meta;
  isEqual: TPartIsEqual<string, any, Meta>;
  factory: (...args: Array<any>) => TCheminParam<N, T, Meta>;
}

export type TCheminParam<N extends string, T, Meta = null> = ICheminParamBase<N, T, Meta> &
  (T extends void ? { noValue: true } : TEmptyObject);

export type TCheminParamAny = TCheminParam<any, any, any>;

function string<N extends string>(name: N): TCheminParam<N, string> {
  return {
    factory: string,
    name,
    meta: null,
    isEqual: (other) => other.name === name,
    match: (value, ...rest) => {
      if (typeof value === 'string' && value.length > 0) {
        return { match: true, value: value, next: rest };
      }
      return { match: false };
    },
    serialize: (value) => value.toString(),
    stringify: () => `:${name}`,
  };
}

function number<N extends string>(name: N): TCheminParam<N, number> {
  return {
    name,
    factory: number,
    meta: null,
    isEqual: (other) => other.name === name,
    match: (value, ...rest) => {
      const parsed = parseFloat(value);
      if (Number.isNaN(parsed)) {
        return { match: false };
      }
      return { match: true, value: parsed, next: rest };
    },
    serialize: (value) => value.toString(),
    stringify: () => `:${name}(number)`,
  };
}

function integer<N extends string>(
  name: N,
  options: {
    strict?: boolean;
  } = {},
): TCheminParam<N, number, { strict: boolean }> {
  const { strict = true } = options;
  return {
    name,
    meta: { strict },
    isEqual: (other) => strict === other.meta.strict,
    factory: integer,
    match: (value, ...rest) => {
      if (!value) {
        return { match: false };
      }
      const parsed = parseInt(value, 10);
      if (Number.isNaN(parsed)) {
        return { match: false };
      }
      if (strict && parsed.toString() !== value) {
        return { match: false };
      }
      return { match: true, value: parsed, next: rest };
    },
    serialize: (value) => {
      if (typeof value !== 'number') {
        throw new Error(`CheminParam.interger expect an interger when serializing`);
      }
      if (Math.round(value) !== value || !Number.isFinite(value)) {
        throw new Error(`CheminParam.interger expect an interger when serializing`);
      }
      return value.toString();
    },
    stringify: () => `:${name}(interger)`,
  };
}

function constant<N extends string>(name: N): TCheminParam<N, void> {
  return {
    name,
    noValue: true,
    meta: null,
    factory: constant,
    isEqual: (other) => other.name === name,
    match: (value, ...rest) => {
      if (name === value) {
        return { match: true, next: rest, value: null };
      }
      return { match: false };
    },
    serialize: () => name,
    stringify: () => name,
  };
}

type OptionalValue<T> = { present: false } | { present: true; value: T };

function optional<N extends string, T>(
  sub: TCheminParam<N, T, any>,
): TCheminParam<N, OptionalValue<T>, { sub: TCheminParam<N, T, any> }> {
  return {
    name: sub.name,
    meta: { sub },
    factory: optional,
    isEqual: (other) => sub.name === other.name && cheminParamsEqual(sub, other.meta.sub),
    match: (...all) => {
      const subMatch = sub.match(...all);
      if (subMatch.match) {
        return {
          match: true,
          value: { present: true, value: subMatch.value as T },
          next: subMatch.next,
        };
      }
      return { match: true, value: { present: false }, next: all };
    },
    serialize: (value) => (value.present ? sub.serialize(value.value) : null),
    stringify: () => `${sub.stringify()}?`,
  };
}

function optionalConst<N extends string>(
  name: N,
  constant: string = name,
): TCheminParam<N, boolean, { constant: string }> {
  return {
    name,
    factory: optionalConst,
    meta: { constant },
    isEqual: (other) => other.meta.constant === constant && other.name === name,
    match: (...all) => {
      if (all[0] === constant) {
        return { match: true, value: true, next: all.slice(1) };
      }
      return { match: true, value: false, next: all };
    },
    serialize: (value) => (value ? constant : null),
    stringify: () => `${constant}?`,
  };
}

function optionalString<N extends string>(name: N): TCheminParam<N, string | false> {
  return {
    name,
    meta: null,
    factory: optionalString,
    isEqual: (other) => other.name === name,
    match: (...all) => {
      if (typeof all[0] === 'string' && all[0].length > 0) {
        return { match: true, value: all[0], next: all.slice(1) };
      }
      return { match: true, value: false, next: all };
    },
    serialize: (value) => (value === false ? null : value),
    stringify: () => `:${name}?`,
  };
}

function multiple<N extends string, T, Meta>(
  sub: TCheminParam<N, T, Meta>,
  atLeastOne: boolean = false,
): TCheminParam<N, Array<T>, { sub: TCheminParam<N, T, Meta>; atLeastOne: boolean }> {
  return {
    name: sub.name,
    meta: { atLeastOne, sub },
    factory: multiple,
    isEqual: (other) =>
      sub.name === other.name && cheminParamsEqual(other.meta.sub, sub) && atLeastOne === other.meta.atLeastOne,
    match: (...all) => {
      const values: Array<T> = [];
      let next = all;
      let nextMatch: TPartMatchResult<T>;
      do {
        nextMatch = sub.match(...next);
        if (nextMatch.match) {
          next = nextMatch.next;
          values.push(nextMatch.value as T);
        }
      } while (nextMatch.match === true);
      if (values.length === 0 && atLeastOne === true) {
        return { match: false };
      }
      return { match: true, value: values, next };
    },
    serialize: (value) => value.map((v) => sub.serialize(v)).join('/'),
    stringify: () => `${sub.stringify()}${atLeastOne ? '+' : '*'}`,
  };
}

export function cheminParamsEqual(
  left: ICheminParamBase<any, any, any>,
  right: ICheminParamBase<any, any, any>,
): boolean {
  if (left.factory !== right.factory) {
    return false;
  }
  return left.isEqual(right);
}
