<p align="center">
  <img src="https://github.com/etienne-dldc/chemin/blob/master/design/logo.png" width="900" alt="chemin logo">
</p>

# 🥾 Chemin [![Build Status](https://travis-ci.org/etienne-dldc/chemin.svg?branch=master)](https://travis-ci.org/etienne-dldc/chemin) [![](https://badgen.net/bundlephobia/minzip/chemin)](https://bundlephobia.com/result?p=chemin) [![codecov](https://codecov.io/gh/etienne-dldc/chemin/branch/master/graph/badge.svg)](https://codecov.io/gh/etienne-dldc/chemin)

> A type-safe pattern builder & route matching library written in TypeScript

## Gist

```js
import { Chemin } from 'chemin';

const chemin = Chemin.parse('/admin/post/:postId/delete?');

console.log(chemin.match('/no/valid'));
// => false

console.log(chemin.match('/admin/post/e5t89u'));
// => { rest: [], params: { postId: 'e5t89u', delete: false } }
```

## More advanced (and type-safe) patterns

Use the `Chemin.create` and `CheminParam` to build more complex **type-safe** paths !

```ts
import { Chemin, CheminParam as P } from 'chemin';

const chemin = Chemin.create('admin', 'post', P.number('postId'), P.optionalConst('delete'));

console.log(chemin.match('/no/valid'));
// => false

const match = chemin.match('/admin/post/45');
console.log(match);
// => { rest: [], params: { postId: 45, delete: false } }
```

## Composition

You can use a `Chemin` inside another to easily compose your routes !

```ts
import { Chemin, CheminParam as P } from 'chemin';

const postFragment = Chemin.create('post', P.number('postId'));
const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');

console.log(postAdmin.stringify()); // /admin/:userId/post/:postId(number)/edit
```

## Custom `CheminParam`

You can create your own `CheminParam` to better fit your application while keeping full type-safety !

```ts
import { Chemin, CheminParam } from 'chemin';

// match only string of 4 char [a-z0-9]
function fourCharStringId<N extends string>(name: N): CheminParam<N, string> {
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
    stringify: () => `:${name}(id4)`
  };
}

const path = Chemin.create('item', fourCharStringId('itemId'));
console.log(path.match('/item/a4e3t')); // false (5 char)
console.log(path.match('/item/A4e3')); // false (Maj)
console.log(path.match('/item/a4e3')); // { rest: [], params: { itemId: 'a4e3' } }
```

> Take a look a [the custom-advanced.ts example](https://github.com/etienne-dldc/chemin/blob/master/examples/custom-advanced.ts).
> and [the build-in CheminParam](https://github.com/etienne-dldc/chemin/blob/master/src/CheminParam.ts#L23).

## API

### Chemin.parse(pattern)

> Parse a string into a `Chemin` object

Accepts a `string` (`/admin/:user/edit?`) and return a `Chemin`.

#### Supported patterns

- `admin`: Create a `CheminParam.constant('admin')`
- `:param`: Create a `CheminParam.string('param')`
- `maybe?`: Create a `CheminParam.optionalConst('maybe')`
- `:maybe?`: Create a `CheminParam.optionalString('maybe')`

```ts
Chemin.parse('/admin/:userId/edit?');
```

### Chemin.create(...parts)

> Create a `Chemin`

Accepts any number or arguments of type `string`, `CheminParam` or `Chemin`.

**Note**: strings are converted to `CheminParam.constant`.

```ts
Chemin.create('admin', CheminParam.number('userId'), CheminParam.optionalConst('edit'));
```

### Chemin.isChemin(maybe)

> Test wether an object is a `Chemin` or not

Accepts one argument and return `true` if it's a `Chemin`, false otherwise.

```ts
Chemin.isChemin(Chemin.parse('/admin')); // true
```

### chemin.parts

> An array of the parts (other `Chemin`s or `CheminParam`s) that make the chemin.

**Note**: You probably don't need this.

**Note 2**: You should not mutate this array or any of it's elements !

### chemin.serialize(params?, options?)

> Serialize a chemin

Accepts some `params` (an object or `null`) and an optional `option` object.

The option object accepts two `boolean` properties:

- `leadingSlash` (default `true`): Add a slash at the begining
- `trailingSlash` (default: `false`): Add a slash at the end

```ts
const chemin = Chemin.create(
  'admin',
  CheminParam.number('userId'),
  CheminParam.optionalConst('edit')
);
chemin.serialize({ userId: 42, edit: true }); // /admin/42/edit
```

### chemin.match(pathname)

> Test a chemin against a pathanme

Accepts a `pathname` and return `false` or `CheminMatchResult`.

- `pathname` can be either a string (`/admin/user/5`) or an array of strings (`['admin', 'user', '5']`)
- `CheminMatchResult` is an object with two properties
  - `rest`: an array of string of the remaining parts of the pathname once the matching is done
  - `params`: an object of params extracted from the matching

**Note**: If you want to pass an array to `pathname` make sure to use `splitPathname`.

### chemin.matchExact(pathname)

Accepts the same arguments as `chemin.match` but return `false` if the path does not match or if `rest` is not empty, otherwise it returns the `params` object directly.

### chemin.extract()

Return an array of all the `Chemin` it contains (as well as the `Chemin` itself).

```ts
import { Chemin } from 'chemin';

const admin = Chemin.create('admin');
const adminUser = Chemin.create(admin, 'user');

adminUser.extract(); // [adminUser, admin];
```

### chemin.stringify()

Return a string representation of the chemin.

```ts
import { Chemin, CheminParam as P } from 'chemin';

const postFragment = Chemin.create('post', P.number('postId'));
const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');

console.log(postAdmin.stringify()); // /admin/:userId/post/:postId(number)/edit
```

### splitPathname(pathname)

> Split a pathname and prevent empty parts

Accepts a string and returns an array od strings.

```ts
splitPathname('/admin/user/5'); // ['admin', 'user', '5']
```

### CheminParam

The `CheminParam` object contains the build-in `CheminParam`.

#### CheminParam.number(name)

> A number using `parseFloat(x)`

```ts
const chemin = Chemin.create(CheminParam.number('myNum'));
Chemin.matchExact(chemin, '/3.1415'); // { myNum: 3.1415 }
```

**NOTE**: Because it uses `parseFloat` this will also accept `Infinity`, `10e2`...

#### CheminParam.integer(name, options?)

> A integer using `parseInt(x, 10)`

```ts
const chemin = Chemin.create(CheminParam.integer('myInt'));
Chemin.matchExact(chemin, '/42'); // { myInt: 42 }
```

By default it will only match if the parsed number is the same as the raw value.
You can pass an option object with `strict: false` to allow any valid `parseInt`:

```ts
const chemin = Chemin.create(CheminParam.integer('myInt', { strict: false }));
Chemin.matchExact(chemin, '/42fooo'); // { myInt: 42 }
```

#### CheminParam.string(name)

> Any non-empty string

```ts
const chemin = Chemin.create(CheminParam.string('myStr'));
Chemin.matchExact(chemin, '/cat'); // { myStr: 'cat' }
```

#### CheminParam.constant(name)

> A constant string

```ts
const chemin = Chemin.create(CheminParam.constant('edit'));
Chemin.matchExact(chemin, '/edit'); // {}
Chemin.matchExact(chemin, '/'); // false
```

#### CheminParam.optional(cheminParam)

> Make any `CheminParam` optional

```ts
const chemin = Chemin.create(CheminParam.optional(CheminParam.integer('myInt')));
Chemin.matchExact(chemin, '/42'); // { myInt: { present: true, value: 42 } }
Chemin.matchExact(chemin, '/'); // { myInt: { present: false } }
```

#### CheminParam.optionalConst(name, path?)

> An optional contant string

```ts
const chemin = Chemin.create(CheminParam.optionalConst('isEditing', 'edit'));
Chemin.matchExact(chemin, '/edit'); // { isEditing: true }
Chemin.matchExact(chemin, '/'); // { isEditing: false }
```

If `path` is omitted then the name is used as the path.

```ts
const chemin = Chemin.create(CheminParam.optionalConst('edit'));
Chemin.matchExact(chemin, '/edit'); // { edit: true }
Chemin.matchExact(chemin, '/'); // { edit: false }
```

#### CheminParam.optionalString(name)

> An optional string parameter

```ts
const chemin = Chemin.create(CheminParam.optionalString('name'));
Chemin.matchExact(chemin, '/paul'); // { name: 'paul' }
Chemin.matchExact(chemin, '/'); // { name: false }
```

#### CheminParam.multiple(cheminParam, atLeastOne?)

> Allow a params to be repeated any number of time

```ts
const chemin = Chemin.create(CheminParam.multiple(CheminParam.string('categories')));
Chemin.matchExact(chemin, '/'); // { categories: [] }
Chemin.matchExact(chemin, '/foo/bar'); // { categories: ['foo', 'bar'] }
```

```ts
const chemin = Chemin.create(CheminParam.multiple(CheminParam.string('categories'), true));
Chemin.matchExact(chemin, '/'); // false because atLeastOne is true
Chemin.matchExact(chemin, '/foo/bar'); // { categories: ['foo', 'bar'] }
```
