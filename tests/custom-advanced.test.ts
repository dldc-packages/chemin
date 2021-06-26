import { Chemin, CheminParam } from '../src';

test('custom advanced', () => {
  interface CustomId {
    num: number;
    name: string;
  }

  // match id 45-paul
  function customId<N extends string>(name: N): CheminParam<N, CustomId> {
    return {
      factory: customId,
      name,
      isEqual: (other) => other.name === name,
      meta: null,
      match: (...all) => {
        const next = all[0];
        const parts = next.split('-');
        if (parts.length !== 2) {
          return { match: false, next: all };
        }
        const num = parseInt(parts[0], 10);
        if (Number.isNaN(num)) {
          return { match: false, next: all };
        }
        return { match: true, value: { num, name: parts[1] }, next: all.slice(1) };
      },
      serialize: (value) => {
        return `${value.num}-${value.name}`;
      },
      stringify: () => `:${name}(customId)`,
    };
  }

  const path = Chemin.create('item', customId('itemId'));

  const match = path.match('/item/42-etienne');

  expect(match).toEqual({ params: { itemId: { name: 'etienne', num: 42 } }, rest: [] });
});
