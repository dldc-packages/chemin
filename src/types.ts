import type { IS_CHEMIN } from './internal';

export interface ICheminMatch<Params> {
  readonly params: Params;
  readonly rest: readonly string[];
  readonly exact: boolean;
}

export type TCheminMatchMaybe<Params> = ICheminMatch<Params> | null;

export type TSimplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

export type TUnionParams<R extends readonly TIn[]> = R extends readonly [infer H, ...infer S]
  ? TParams<H> & (S extends readonly TIn[] ? TUnionParams<S> : TEmptyObject)
  : TEmptyObject;

export type TCreateChemin = <Args extends readonly TIn[]>(...args: Args) => IChemin<TSimplify<TUnionParams<Args>>>;

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
  readonly leadingSlash?: boolean;
  readonly trailingSlash?: boolean;
}

export type TIn = string | TCheminParamAny | IChemin<any>;

export type TPartMatchResult<T> =
  | { readonly match: false }
  | { readonly match: true; readonly value: T extends void ? null : T; readonly next: ReadonlyArray<string> };

export type TPartMatch<T> = (...parts: Array<string>) => TPartMatchResult<T>;

export type TPartSerialize<T> = (value: T) => string | null;

export type TPartIsEqual<N extends string, T, Meta> = (other: TCheminParam<N, T, Meta>) => boolean;

export type TPartStringify = () => string;

export interface ICheminParamBase<N extends string, T, Meta> {
  readonly name: N;
  readonly match: TPartMatch<T>;
  readonly stringify: TPartStringify;
  readonly serialize: TPartSerialize<T>;
  readonly meta: Meta;
  readonly isEqual: TPartIsEqual<string, any, Meta>;
  readonly factory: (...args: Array<any>) => TCheminParam<N, T, Meta>;
}

export type TCheminParam<N extends string, T, Meta = null> = ICheminParamBase<N, T, Meta> &
  (T extends void ? { noValue: true } : TEmptyObject);

export type TCheminParamAny = TCheminParam<any, any, any>;

export type TSerialize<Params> = TEmptyObject extends Params
  ? (params?: null, options?: ISlashOptions) => string
  : (params: Params, options?: ISlashOptions) => string;

export interface IChemin<Params = any> {
  readonly [IS_CHEMIN]: Params;
  readonly parts: ReadonlyArray<TPart>;
  readonly serialize: TSerialize<Params>;
  readonly match: (pathname: string | Array<string>) => TCheminMatchMaybe<Params>;
  readonly matchExact: (pathname: string | Array<string>) => Params | null;
  readonly stringify: (options?: ISlashOptions) => string;

  readonly extract: () => Array<IChemin>;
  readonly flatten: () => Array<TCheminParamAny>;
}
