import { IS_CHEMIN } from './internal';
import type { IChemin, ICheminMatch, TPart } from './types';

export function isChemin(maybe: any): maybe is IChemin<any> {
  return maybe && maybe[IS_CHEMIN];
}

export function matchPart(part: TPart, pathname: readonly string[]): ICheminMatch<any> | null {
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

export function matchParts(parts: ReadonlyArray<TPart>, pathname: readonly string[]): ICheminMatch<any> | null {
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
