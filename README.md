<p align="center">
  <img src="https://github.com/etienne-dldc/chemin/blob/master/design/logo.png" width="597" alt="chemin logo">
</p>

# 🥾 Chemin [![Build Status](https://travis-ci.org/etienne-dldc/chemin.svg?branch=master)](https://travis-ci.org/etienne-dldc/chemin)

> A type-safe pattern builder / matching written in TypeScript

## Gist

```js
import { Chemin } from 'chemin';

const path = Chemin.parse('/admin/post/:postId/delete?');

console.log(Chemin.match(path, '/no/valid'));
// => false

console.log(Chemin.match(path, '/admin/post/e5t89u'));
// => { rest: [], params: { postId: 'e5t89u', delete: false } }
```

## More advanced (and type-safe) patterns

Use the `Chemin.create` and `CheminParams` to build more complex **type-safe** paths !

```ts
import { Chemin, CheminParams as P } from 'chemin';

const path = Chemin.create('admin', 'post', P.number('postId'), P.optionalConst('delete'));

console.log(Chemin.match(path, '/no/valid'));
// => false

const match = Chemin.match(path, '/admin/post/45');
console.log(match);
// => { rest: [], params: { postId: 45, delete: false } }
```

## Composition

You can use a `Chemin` inside another to easily compose your routes !

```ts
import { Chemin, CheminParams as P } from 'chemin';

const postFragment = Chemin.create('post', P.number('postId'));
const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');

console.log(Chemin.stringify(postAdmin)); // /admin/:userId/post/:postId(number)/edit
```

## Custom `CheminParams`

You can create your own `CheminParams` to match better fit your application while keeping full type-safety !

```ts
import { Chemin, CheminParams } from 'chemin';

// match only string of 4 char [a-z0-9]
function fourCharStringId<N extends string>(name: N): CheminParams<N, string> {
  const reg = /[a-z0-9]{4}/;
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
```

Take a look a [the custom-advanced.ts example](https://github.com/etienne-dldc/chemin/blob/master/examples/custom-advanced.ts).
Also take a look at [the build-in CheminParams](https://github.com/etienne-dldc/chemin/blob/master/src/CheminParams.ts#L22).
