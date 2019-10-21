<p align="center">
  <img src="https://github.com/etienne-dldc/chemin/blob/master/design/logo.png" width="597" alt="chemin logo">
</p>

# 🥾 Chemin [![Build Status](https://travis-ci.org/etienne-dldc/chemin.svg?branch=master)](https://travis-ci.org/etienne-dldc/chemin)

> A type-safe pattern builder / matching written in TypeScript

## Gist

```js
import { Chemin } from '../dist';

const path = Chemin.parse('/admin/post/:postId/delete?');

console.log(Chemin.match(path, '/no/valid'));
// => false

console.log(Chemin.match(path, '/admin/post/e5t89u'));
// => { rest: [], params: { postId: 'e5t89u', delete: false } }
```
