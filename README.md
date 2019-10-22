<p align="center">
  <img src="https://github.com/etienne-dldc/chemin/blob/master/design/logo.png" width="900" alt="chemin logo">
</p>

# 🥾 Chemin [![Build Status](https://travis-ci.org/etienne-dldc/chemin.svg?branch=master)](https://travis-ci.org/etienne-dldc/chemin)

> A type-safe pattern builder & route matching library written in TypeScript

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

## API

### Chemin.parse(pattern)

> Parse a string into a `Chemin` object

Accepts a `string` (`/admin/:user/edit?`) and return a `Chemin`.

#### Supported patterns

- `admin`: Create a `CheminParams.constant('admin')`
- `:param`: Create a `CheminParams.string('param')`
- `maybe?`: Create a `CheminParams.optionalConst('maybe')`
- `:maybe?`: Create a `CheminParams.optional(CheminParams.string('maybe'))`

```ts
Chemin.parse('/admin/:userId/edit?');
```

### Chemin.create(...parts)

> Create a `Chemin`

Accepts any number or arguments of type `string`, `CheminParams` or `Chemin`.

**Note**: strings are converted to `CheminParams.constant`.

```ts
Chemin.create('admin', CheminParams.number('userId'), CheminParams.optionalConst('edit'));
```

### Chemin.serialize(chemin, params)

> Serialize a chemin

Accepts a `Chemin` and some params adn output a string.

```ts
const chemin = Chemin.create('admin', CheminParams.number('userId'), CheminParams.optionalConst('edit'));
Chemin.serialize(chemin, { userId: 42, edit: true }); // /admin/42/edit
```

### Chemin.stringify(chemin)

> Convert a chemin to a human readable string

Accepts a single `Chemin` and return a `string`.

```ts
const chemin = Chemin.create('admin', CheminParams.number('userId'), CheminParams.optionalConst('edit'));
Chemin.stringify(chemin); // /admin/:userId(number)/edit?
```

### Chemin.is(maybe)

> Test wether an object is `Chemin` or not

Accepts one argument and return `true` if it's a `Chemin`, false otherwise.

### Chemin.match(chemin, pathname)

> Test a chemin against a pathanme

Accepts a `Chemin` and a `pathname` and return `false` or `CheminMatchResult`.

- `pathname` can be either a string (`/admin/user/5`) or an array of strings (`['admin', 'user', '5']`)
- `CheminMatchResult` is an object with two properties
  - `rest`: an array of string of the remaining parts of the pathname once teh matching was done
  - `params`: an object of params extracted from the matching

**Note**: If you want to pass an array to `pathname` make sure to use `CheminUtils.splitPathname`.

### Chemin.matchExact(chemin, pathname)

Accepts the same arguments as `Chemin.match` but return `false` if the path does not match or if `rest` is not empty, otherwise it returns the `params` object directly.

### CheminUtils.splitPathname(pathname)

> Split a pathname and prevent empty parts

Accepts a string and returns an array od strings.

```ts
CheminUtils.splitPathname('/admin/user/5'); // ['admin', 'user', '5']
```

### CheminParams

The `CheminParams` object contains the build-in `CheminParams`.

#### CheminParams.number(name)

> A number using `parseFloat(x)`

```ts
const chemin = Chemin.create(CheminParams.number('myNum'));
Chemin.matchExact(chemin, '/3.1415'); // { myNum: 3.1415 }
```

#### CheminParams.number(name)

> A interger using `parseInt(x, 10)`

```ts
const chemin = Chemin.create(CheminParams.interger('myInt'));
Chemin.matchExact(chemin, '/42'); // { myInt: 42 }
```

#### CheminParams.string(name)

> Any non-empty string

```ts
const chemin = Chemin.create(CheminParams.string('myStr'));
Chemin.matchExact(chemin, '/cat'); // { myStr: 'cat' }
```

#### CheminParams.constant(name)

> A constant string

```ts
const chemin = Chemin.create(CheminParams.constant('edit'));
Chemin.matchExact(chemin, '/edit'); // {}
Chemin.matchExact(chemin, '/'); // false
```

#### CheminParams.optional(cheminParam)

> Make any `CheminParams` optional

```ts
const chemin = Chemin.create(CheminParams.optional(CheminParams.interger('myInt')));
Chemin.matchExact(chemin, '/42'); // { myInt: { present: true, value: 42 } }
Chemin.matchExact(chemin, '/'); // { myInt: { present: false } }
```

#### CheminParams.optionalConst(name, path?)

> An optional contant string

```ts
const chemin = Chemin.create(CheminParams.optionalConst('isEditing', 'edit'));
Chemin.matchExact(chemin, '/edit'); // { isEditing: true }
Chemin.matchExact(chemin, '/'); // { isEditing: false }
```

If `path` is omitted then the name is used as the path.

```ts
const chemin = Chemin.create(CheminParams.optionalConst('edit'));
Chemin.matchExact(chemin, '/edit'); // { edit: true }
Chemin.matchExact(chemin, '/'); // { edit: false }
```

#### CheminParams.multiple(cheminParam, atLeastOne?)

> Allow a params to be repeated any number of time

```ts
const chemin = Chemin.create(CheminParams.multiple(CheminParams.string('categories')));
Chemin.matchExact(chemin, '/'); // { categories: [] }
Chemin.matchExact(chemin, '/foo/bar'); // { categories: ['foo', 'bar'] }
```

```ts
const chemin = Chemin.create(CheminParams.multiple(CheminParams.string('categories'), true));
Chemin.matchExact(chemin, '/'); // false because atLeastOne is true
Chemin.matchExact(chemin, '/foo/bar'); // { categories: ['foo', 'bar'] }
```
