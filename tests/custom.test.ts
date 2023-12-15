import { expect, test } from 'vitest';
import { chemin, type TCheminParam } from '../src/mod';

test('custom matcher', () => {
  // match only string of 4 char [a-z0-9]
  function pFourCharStringId<N extends string>(name: N): TCheminParam<N, string> {
    const reg = /^[a-z0-9]{4}$/;
    return {
      factory: pFourCharStringId,
      name,
      meta: null,
      isEqual: (other) => other.name === name,
      match: (...all) => {
        if (all[0].match(reg)) {
          return { match: true, value: all[0], next: all.slice(1) };
        }
        return { match: false, next: all };
      },
      serialize: (value) => value,
      stringify: () => `:${name}(id4)`,
    };
  }

  const path = chemin('item', pFourCharStringId('itemId'));
  expect(path.match('/item/a4e3t')).toBe(null);
  expect(path.match('/item/A4e3')).toBe(null);
  expect(path.match('/item/a4e3')).toEqual({ rest: [], params: { itemId: 'a4e3' }, exact: true });
});
