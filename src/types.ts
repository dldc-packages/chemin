import type { IS_CHEMIN } from "./internal.ts";

/**
 * Chemin match result
 */
export interface ICheminMatch<Params> {
  /**
   * Params extracted from the pathname
   */
  readonly params: Params;
  /**
   * Rest of the pathname that was not matched
   */
  readonly rest: readonly string[];
  /**
   * True if the match is exact (rest is empty)
   */
  readonly exact: boolean;
}

/**
 * Chemin match result or null if no match
 */
export type TCheminMatchMaybe<Params> = ICheminMatch<Params> | null;

/**
 * Simplify a type by removing the `undefined` type
 */
// deno-lint-ignore ban-types
export type TSimplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

/**
 * Union of all the params of a list of chemins
 */
export type TUnionParams<R extends readonly TIn[]> = R extends readonly [
  infer H,
  ...infer S
]
  ? TParams<H> & (S extends readonly TIn[] ? TUnionParams<S> : TEmptyObject)
  : TEmptyObject;

/**
 * Advanced type of teh createChemin function
 */
export type TCreateChemin = <Args extends readonly TIn[]>(
  ...args: Args
) => IChemin<TSimplify<TUnionParams<Args>>>;

/**
 * Part of a chemin, can be a param or a chemin
 */
export type TPart = TCheminParamAny | IChemin<any>;

/**
 * Empty object type
 */
export type TEmptyObject = Record<never, never>;

/**
 * Extract the params type of a chemin
 */
export type TParams<T> = T extends string
  ? TEmptyObject
  : T extends IChemin<infer P>
  ? P
  : T extends TCheminParam<any, void, any>
  ? TEmptyObject
  : T extends TCheminParam<infer N, infer P, any>
  ? { [K in N]: P }
  : TEmptyObject;

/**
 * Otpions for the serialize function
 */
export interface ISlashOptions {
  readonly leadingSlash?: boolean;
  readonly trailingSlash?: boolean;
}

/**
 * Type of the input of the serialize function
 */
export type TIn = string | TCheminParamAny | IChemin<any>;

/**
 * Result of a match
 */
export type TPartMatchResult<T> =
  | { readonly match: false }
  | {
      readonly match: true;
      readonly value: T extends void ? null : T;
      readonly next: ReadonlyArray<string>;
    };

/**
 * Part match function
 */
export type TPartMatch<T> = (...parts: Array<string>) => TPartMatchResult<T>;

/**
 * Part serialize function
 */
export type TPartSerialize<T> = (value: T) => string | null;

/**
 * Part isEqual function
 */
export type TPartIsEqual<N extends string, T, Meta> = (
  other: TCheminParam<N, T, Meta>
) => boolean;

/**
 * Part stringify function
 */
export type TPartStringify = () => string;

/**
 * Base interface for a chemin param
 */
export interface ICheminParamBase<N extends string, T, Meta> {
  readonly name: N;
  readonly match: TPartMatch<T>;
  readonly stringify: TPartStringify;
  readonly serialize: TPartSerialize<T>;
  readonly meta: Meta;
  readonly isEqual: TPartIsEqual<string, any, Meta>;
  readonly factory: (...args: Array<any>) => TCheminParam<N, T, Meta>;
}

/**
 * Chemin param type
 */
export type TCheminParam<N extends string, T, Meta = null> = ICheminParamBase<
  N,
  T,
  Meta
> &
  (T extends void ? { noValue: true } : TEmptyObject);

/**
 * Chemin param type with any value
 */
export type TCheminParamAny = TCheminParam<any, any, any>;

/**
 * Serialize function type
 */
export type TSerialize<Params> = TEmptyObject extends Params
  ? (params?: null, options?: ISlashOptions) => string
  : (params: Params, options?: ISlashOptions) => string;

/**
 * Chemin interface
 */
export interface IChemin<Params = any> {
  readonly [IS_CHEMIN]: Params;
  readonly parts: ReadonlyArray<TPart>;
  readonly serialize: TSerialize<Params>;
  readonly match: (
    pathname: string | Array<string>
  ) => TCheminMatchMaybe<Params>;
  readonly matchExact: (pathname: string | Array<string>) => Params | null;
  readonly stringify: (options?: ISlashOptions) => string;

  readonly extract: () => Array<IChemin>;
  readonly flatten: () => Array<TCheminParamAny>;
}
