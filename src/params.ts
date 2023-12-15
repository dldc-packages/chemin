import type { ICheminParamBase, TCheminParam, TPartMatchResult } from './types';

export function pString<N extends string>(name: N): TCheminParam<N, string> {
  return {
    factory: pString,
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

export function pNumber<N extends string>(name: N): TCheminParam<N, number> {
  return {
    name,
    factory: pNumber,
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

export function pInteger<N extends string>(
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
    factory: pInteger,
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

export function pConstant<N extends string>(name: N): TCheminParam<N, void> {
  return {
    name,
    noValue: true,
    meta: null,
    factory: pConstant,
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

export function pOptional<N extends string, T>(
  sub: TCheminParam<N, T, any>,
): TCheminParam<N, OptionalValue<T>, { sub: TCheminParam<N, T, any> }> {
  return {
    name: sub.name,
    meta: { sub },
    factory: pOptional,
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

export function pOptionalConst<N extends string>(
  name: N,
  constant: string = name,
): TCheminParam<N, boolean, { constant: string }> {
  return {
    name,
    factory: pOptionalConst,
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

export function pOptionalString<N extends string>(name: N): TCheminParam<N, string | false> {
  return {
    name,
    meta: null,
    factory: pOptionalString,
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

export function pMultiple<N extends string, T, Meta>(
  sub: TCheminParam<N, T, Meta>,
  atLeastOne: boolean = false,
): TCheminParam<N, Array<T>, { sub: TCheminParam<N, T, Meta>; atLeastOne: boolean }> {
  return {
    name: sub.name,
    meta: { atLeastOne, sub },
    factory: pMultiple,
    isEqual: (other) =>
      sub.name === other.name && cheminParamsEqual(other.meta.sub, sub) && atLeastOne === other.meta.atLeastOne,
    match: (...all) => {
      const values: Array<T> = [];
      let next = all as readonly string[];
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
