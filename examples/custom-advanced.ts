import { Chemin, CheminParam } from '../src';

interface CustomId {
  num: number;
  name: string;
}

// match id 45-paul
function customId<N extends string>(name: N): CheminParam<N, CustomId> {
  return {
    name,
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
    serialize: value => {
      return `${value.num}-${value.name}`;
    },
    toString: () => `:${name}(customId)`,
  };
}

const path = Chemin.create('item', customId('itemId'));

const match = Chemin.match(path, '/item/42-etienne');

console.log(match);
