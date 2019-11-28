export const CheminParam = {
  number,
  integer,
  string,
  constant,
  optional,
  optionalConst,
  optionalString,
  multiple
};

type PartMatchResult<T> =
  | { match: false }
  | { match: true; value: T extends void ? null : T; next: Array<string> };
type PartMatch<T> = (...parts: Array<string>) => PartMatchResult<T>;
type PartSerialize<T> = (value: T) => string | null;
type PartToString = () => string;

export type CheminParam<N extends string, T> = {
  name: N;
  match: PartMatch<T>;
  toString: PartToString;
  serialize: PartSerialize<T>;
} & (T extends void ? { noValue: true } : {});

function string<N extends string>(name: N): CheminParam<N, string> {
  return {
    name,
    match: (value, ...rest) => {
      if (typeof value === 'string' && value.length > 0) {
        return { match: true, value: value, next: rest };
      }
      return { match: false };
    },
    serialize: value => value.toString(),
    toString: () => `:${name}`
  };
}

function number<N extends string>(name: N): CheminParam<N, number> {
  return {
    name,
    match: (value, ...rest) => {
      const parsed = parseFloat(value);
      if (Number.isNaN(parsed)) {
        return { match: false };
      }
      return { match: true, value: parsed, next: rest };
    },
    serialize: value => value.toString(),
    toString: () => `:${name}(number)`
  };
}

export interface IntergerOptions {
  strict?: boolean;
}

function integer<N extends string>(name: N, options: IntergerOptions = {}): CheminParam<N, number> {
  const { strict = true } = options;
  return {
    name,
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
    serialize: value => {
      if (typeof value !== 'number') {
        throw new Error(`CheminParam.interger expect an interger when serializing`);
      }
      if (Math.round(value) !== value || !Number.isFinite(value)) {
        throw new Error(`CheminParam.interger expect an interger when serializing`);
      }
      return value.toString();
    },
    toString: () => `:${name}(interger)`
  };
}

function constant<N extends string>(name: N): CheminParam<N, void> {
  return {
    name,
    noValue: true,
    match: (value, ...rest) => {
      if (name === value) {
        return { match: true, next: rest, value: null };
      }
      return { match: false };
    },
    serialize: () => name,
    toString: () => name
  };
}

type OptionalValue<T> = { present: false } | { present: true; value: T };

function optional<N extends string, T extends any>(
  sub: CheminParam<N, T>
): CheminParam<N, OptionalValue<T>> {
  return {
    name: sub.name,
    match: (...all) => {
      const subMatch = sub.match(...all);
      if (subMatch.match) {
        return {
          match: true,
          value: { present: true, value: subMatch.value },
          next: subMatch.next
        };
      }
      return { match: true, value: { present: false }, next: all };
    },
    serialize: value => (value.present ? sub.serialize(value.value) : null),
    toString: () => `${sub.toString()}?`
  };
}

function optionalConst<N extends string>(
  name: N,
  constant: string = name
): CheminParam<N, boolean> {
  return {
    name,
    match: (...all) => {
      if (all[0] === constant) {
        return { match: true, value: true, next: all.slice(1) };
      }
      return { match: true, value: false, next: all };
    },
    serialize: value => (value ? constant : null),
    toString: () => `${constant}?`
  };
}

function optionalString<N extends string>(name: N): CheminParam<N, string | false> {
  return {
    name,
    match: (...all) => {
      if (typeof all[0] === 'string' && all[0].length > 0) {
        return { match: true, value: all[0], next: all.slice(1) };
      }
      return { match: true, value: false, next: all };
    },
    serialize: value => (value === false ? null : value),
    toString: () => `:${name}?`
  };
}

function multiple<N extends string, T extends any>(
  sub: CheminParam<N, T>,
  atLeastOne: boolean = false
): CheminParam<N, Array<T>> {
  return {
    name: sub.name,
    match: (...all) => {
      const values: Array<T> = [];
      let next = all;
      let nextMatch: PartMatchResult<T>;
      do {
        nextMatch = sub.match(...next);
        if (nextMatch.match) {
          next = nextMatch.next;
          values.push(nextMatch.value);
        }
      } while (nextMatch.match === true);
      if (values.length === 0 && atLeastOne === true) {
        return { match: false };
      }
      return { match: true, value: values, next };
    },
    serialize: value => value.map(v => sub.serialize(v)).join('/'),
    toString: () => `${sub.toString()}${atLeastOne ? '+' : '*'}`
  };
}
