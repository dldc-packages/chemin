export const CheminParams = {
  number,
  integer,
  string,
  constant,
  optional,
  optionalConst,
  multiple,
};

type PartMatchResult<T> = { match: false } | { match: true; value: T extends void ? null : T; next: Array<string> };
type PartMatch<T> = (...parts: Array<string>) => PartMatchResult<T>;
type PartSerialize<T> = (value: T) => string | null;
type PartStringify = () => string;

export type CheminParams<N extends string, T> = {
  name: N;
  match: PartMatch<T>;
  stringify: PartStringify;
  serialize: PartSerialize<T>;
} & (T extends void ? { noValue: true } : {});

function string<N extends string>(name: N): CheminParams<N, string> {
  return {
    name,
    match: (value, ...rest) => {
      if (typeof value === 'string' && value.length > 0) {
        return { match: true, value: value, next: rest };
      }
      return { match: false };
    },
    serialize: value => value.toString(),
    stringify: () => `:${name}`,
  };
}

function number<N extends string>(name: N): CheminParams<N, number> {
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
    stringify: () => `:${name}(number)`,
  };
}

function integer<N extends string>(name: N): CheminParams<N, number> {
  return {
    name,
    match: (value, ...rest) => {
      const parsed = parseInt(value, 10);
      if (Number.isNaN(parsed)) {
        return { match: false };
      }
      return { match: true, value: parsed, next: rest };
    },
    serialize: value => value.toString(),
    stringify: () => `:${name}(number)`,
  };
}

function constant<N extends string>(name: N): CheminParams<N, void> {
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
    stringify: () => name,
  };
}

type OptionalValue<T> = { present: false } | { present: true; value: T };

function optional<N extends string, T extends any>(sub: CheminParams<N, T>): CheminParams<N, OptionalValue<T>> {
  return {
    name: sub.name,
    match: (...all) => {
      const subMatch = sub.match(...all);
      if (subMatch.match) {
        return { match: true, value: { present: true, value: subMatch.value }, next: subMatch.next };
      }
      return { match: true, value: { present: false }, next: all };
    },
    serialize: value => (value.present ? sub.serialize(value.value) : null),
    stringify: () => `${sub.stringify()}?`,
  };
}

function optionalConst<N extends string>(name: N, constant: string = name): CheminParams<N, boolean> {
  return {
    name,
    match: (...all) => {
      if (all[0] === constant) {
        return { match: true, value: true, next: all.slice(1) };
      }
      return { match: true, value: false, next: all };
    },
    serialize: value => (value ? constant : null),
    stringify: () => `${constant}?`,
  };
}

function multiple<N extends string, T extends any>(
  sub: CheminParams<N, T>,
  atLeastOne: boolean = false
): CheminParams<N, Array<T>> {
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
    stringify: () => `${sub.stringify()}${atLeastOne ? '+' : '*'}`,
  };
}
