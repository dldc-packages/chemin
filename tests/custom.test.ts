import { Chemin, CheminParam } from '../src/mod';

test('custom matcher', () => {
  // match only string of 4 char [a-z0-9]
  function fourCharStringId<N extends string>(name: N): CheminParam<N, string> {
    const reg = /^[a-z0-9]{4}$/;
    return {
      factory: fourCharStringId,
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

  const path = Chemin.create('item', fourCharStringId('itemId'));
  expect(path.match('/item/a4e3t')).toBe(false);
  expect(path.match('/item/A4e3')).toBe(false);
  expect(path.match('/item/a4e3')).toEqual({ rest: [], params: { itemId: 'a4e3' } });
});
