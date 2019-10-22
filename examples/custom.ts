import { Chemin, CheminParams } from '../dist';

// match only string of 4 char [a-z0-9]
function fourCharStringId<N extends string>(name: N): CheminParams<N, string> {
  const reg = /^[a-z0-9]{4}$/;
  return {
    name,
    match: (...all) => {
      if (all[0].match(reg)) {
        return { match: true, value: all[0], next: all.slice(1) };
      }
      return { match: false, next: all };
    },
    serialize: value => value,
    stringify: () => `:${name}(id4)`,
  };
}

const path = Chemin.create('item', fourCharStringId('itemId'));
console.log(Chemin.match(path, '/item/a4e3t')); // false (5 char)
console.log(Chemin.match(path, '/item/A4e3')); // false (Maj)
console.log(Chemin.match(path, '/item/a4e3')); // { rest: [], params: { itemId: 'a4e3' } }
