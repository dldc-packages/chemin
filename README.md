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

```ts
import { Chemin, CheminParams as P } from 'chemin';

const path = Chemin.create('admin', 'post', P.number('postId'), P.optionalConst('delete'));

console.log(Chemin.match(path, '/no/valid'));
// => false

const match = Chemin.match(path, '/admin/post/45');
console.log(match);
// => { rest: [], params: { postId: 'e5t89u', delete: false } }

// match has the correct type
console.log(match && match.params.postId); // postId is a number
console.log(match && match.params.delete); // postId is a boolean
```

## Composition

```ts
import { Chemin, CheminParams as P } from 'chemin';

const postFragment = Chemin.create('post', P.number('postId'));
const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');

console.log(Chemin.stringify(postAdmin)); // /admin/:userId/post/:postId(number)/edit
```
