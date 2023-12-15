<p align="center">
  <img src="https://github.com/dldc-packages/chemin/raw/main/design/logo.png" width="900" alt="chemin logo">
</p>

# 🥾 Chemin

> A type-safe pattern builder & route matching library written in TypeScript

## Gist

```js
import { chemin, pNumber, pOptionalConst } from '@dldc/chemin';

// admin/post/:postId(number)/delete?
const path = chemin('admin', 'post', pNumber('postId'), pOptionalConst('delete'));

console.log(path.match('/no/valid'));
// => null

const match = path.match('/admin/post/45');
console.log(match);
// => { rest: [], exact: true, params: { postId: 45, delete: false } }
// match.params is typed as { postId: number, delete: boolean } !
```

## Composition

You can use a `Chemin` inside another one to easily compose your routes !

```ts
import { chemin, pNumber, pString } from '@dldc/chemin';

const postFragment = chemin('post', pNumber('postId'));
const postAdmin = chemin('admin', pString('userId'), postFragment, 'edit');

console.log(postAdmin.stringify()); // /admin/:userId/post/:postId(number)/edit
```

## Build-in params

The following params are build-in and exported from `@dldc/chemin`.

### pNumber(name)

> A number using `parseFloat(x)`

```ts
const chemin = chemin(pNumber('myNum'));
matchExact(chemin, '/3.1415'); // { myNum: 3.1415 }
```

**NOTE**: Because it uses `parseFloat` this will also accept `Infinity`, `10e2`...

### pInteger(name, options?)

> A integer using `parseInt(x, 10)`

```ts
const chemin = chemin(pInteger('myInt'));
matchExact(chemin, '/42'); // { myInt: 42 }
```

The `options` parameter is optional and accepts a `strict` boolean property (`true` by default). When strict is set to `true` (the default) it will only match if the parsed number is the same as the raw value (so `1.0` or `42blabla` will not match).

```ts
const chemin = chemin(pInteger('myInt', { strict: false }));
matchExact(chemin, '/42fooo'); // { myInt: 42 }
```

### pString(name)

> Any non-empty string

```ts
const chemin = chemin(pString('myStr'));
matchExact(chemin, '/cat'); // { myStr: 'cat' }
```

### pConstant(name)

> A constant string

```ts
const chemin = chemin(pConstant('edit'));
matchExact(chemin, '/edit'); // {}
matchExact(chemin, '/'); // false
```

### pOptional(param)

> Make any `Param` optional

```ts
const chemin = chemin(pOptional(pInteger('myInt')));
matchExact(chemin, '/42'); // { myInt: { present: true, value: 42 } }
matchExact(chemin, '/'); // { myInt: { present: false } }
```

### pOptionalConst(name, path?)

> An optional contant string

```ts
const chemin = chemin(pOptionalConst('isEditing', 'edit'));
matchExact(chemin, '/edit'); // { isEditing: true }
matchExact(chemin, '/'); // { isEditing: false }
```

If `path` is omitted then the name is used as the path.

```ts
const chemin = chemin(pOptionalConst('edit'));
matchExact(chemin, '/edit'); // { edit: true }
matchExact(chemin, '/'); // { edit: false }
```

### pOptionalString(name)

> An optional string parameter

```ts
const chemin = chemin(pOptionalString('name'));
matchExact(chemin, '/paul'); // { name: 'paul' }
matchExact(chemin, '/'); // { name: false }
```

### pMultiple(param, atLeastOne?)

> Allow a params to be repeated any number of time

```ts
const chemin = chemin(pMultiple(pString('categories')));
matchExact(chemin, '/'); // { categories: [] }
matchExact(chemin, '/foo/bar'); // { categories: ['foo', 'bar'] }
```

```ts
const chemin = chemin(pMultiple(pString('categories'), true));
matchExact(chemin, '/'); // false because atLeastOne is true
matchExact(chemin, '/foo/bar'); // { categories: ['foo', 'bar'] }
```

## Custom `Param`

You can create your own `Param` to better fit your application while keeping full type-safety !

```ts
import { chemin, type TCheminParam } from '@dldc/chemin';

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
console.log(path.match('/item/a4e3t')); // null (5 char)
console.log(path.match('/item/A4e3')); // null (because A is uppercase)
console.log(path.match('/item/a4e3')); // { rest: [], exact: true, params: { itemId: 'a4e3' } }
```

> Take a look a [the custom-advanced.test.ts example](https://github.com/dldc-packages/chemin/blob/main/tests/custom-advanced.test.ts).
> and [the build-in Params](https://github.com/dldc-packages/chemin/blob/main/src/params.ts).

## API

### chemin(...parts)

> Create a `Chemin`

Accepts any number or arguments of type `string`, `TCheminParam` or `IChemin`.

**Note**: strings are converted to `pConstant`.

```ts
chemin('admin', pNumber('userId'), pOptionalConst('edit'));
```

The `chemin` function returns an object with the following properties:

- `parts`: an array of the parts (other `Chemin`s or `Param`s), this is what was passed to the `chemin` function except that strings are converted to `pConstant`.
- `match(pathname)`: test a chemin against a pathname, see `match` for more details.
- `matchExact(pathname)`: test a chemin against a pathname for an exact match, see `matchExact` for more details.
- `stringify(params?, options?)`: serialize a chemin, see `stringify` for more details.
- `serialize(params?, options?)`: serialize a chemin, see `serialize` for more details.
- `extract()`: return an array of all the `Chemin` it contains (as well as the `Chemin` itself), see `extract` for more details.
- `flatten()`: return all the `Param` it contains, see `flatten` for more details.

_Note_: Most of these functions are also exported as standalone functions (see below). The only difference is that `extract` and `flatten` are cached when called on a `Chemin` itself, but you should rarely need to use them anyway.

### isChemin(maybe)

> Test wether an object is a `Chemin` or not

Accepts one argument and return `true` if it's a `Chemin`, false otherwise.

```ts
isChemin(chemin('admin')); // true
```

### cheminFactory(defaultSerializeOptions)

The `cheminFactory` function returns a function that works exactly like `chemin` but with a default `serialize` / `stringify` options.

The `defaultSerializeOptions` parameter is optional and accepts two `boolean` properties:

- `leadingSlash` (default `true`): Add a slash at the begining
- `trailingSlash` (default: `false`): Add a slash at the end

### match(chemin, pathname)

> Test a chemin against a pathname

Returns `null` or `ICheminMatch`.

- `pathname` can be either a string (`/admin/user/5`) or an array of strings (`['admin', 'user', '5']`)
- `ICheminMatch` is an object with three properties
  - `rest`: an array of string of the remaining parts of the pathname once the matching is done
  - `exact`: a boolean indicating if the match is exact or not (if `rest` is empty or not)
  - `params`: an object of params extracted from the matching

**Note**: When `pathname` is a `string`, it is splitted using the `splitPathname` function. This function is exported so you can use it to split your pathnames in the same way.

```ts
import { chemin, pNumber, pOptionalConst, match } from '@dldc/chemin';

const chemin = chemin('admin', pNumber('userId'), pOptionalConst('edit'));
match(chemin, '/admin/42/edit'); // { rest: [], exact: true, params: { userId: 42, edit: true } }
match(chemin, '/admin/42/edit/rest'); // { rest: ['rest'], exact: false, params: { userId: 42, edit: true } }
match(chemin, '/noop'); // null
```

### matchExact(chemin pathname)

Accepts the same arguments as `match` but return `null` if the path does not match or if `rest` is not empty, otherwise it returns the `params` object directly.

### serialize(chemin, params?, options?)

> Print a chemin from its params.

Accepts a `chemin` some `params` (an object or `null`) and an optional `option` object.

The option object accepts two `boolean` properties:

- `leadingSlash` (default `true`): Add a slash at the begining
- `trailingSlash` (default: `false`): Add a slash at the end

```ts
const chemin = chemin('admin', pNumber('userId'), pOptionalConst('edit'));
serialize(chemin, { userId: 42, edit: true }); // /admin/42/edit
```

### splitPathname(pathname)

> Split a pathname and prevent empty parts

Accepts a string and returns an array of strings.

```ts
splitPathname('/admin/user/5'); // ['admin', 'user', '5']
```

### partialMatch(chemin, match, part)

> This function let you extract the params of a chemin that is part of another one

```ts
const workspaceBase = chemin('workspace', pString('tenant'));

const routes = [
  chemin('home'), // home
  chemin('settings'), // settings
  chemin(workspaceBase, 'home'), // workspace home
  chemin(workspaceBase, 'settings'), // workspace settings
];

function app(pathname: string) {
  const route = matchFirst(routes, pathname);
  if (!route) {
    return { route: null };
  }
  const { chemin, match } = route;
  // extract the tenant from the workspace if it's a workspace route
  const params = partialMatch(chemin, match, workspaceBase);
  // params is typed as { tenant: string } | null
  if (params) {
    return { tenant: params.tenant, route: chemin.stringify() };
  }
  return { route: chemin.stringify() };
}
```

**Note**: This is based on reference equality so it will not work if you create a new `Chemin` with the same parts: `chemin('workspace', pString('tenant'))` !

**Note 2**: In reality this function simply returns the `match.params` object if the `part` is contained in `chemin` or `null` otherwise. This mean that you might get more properties that what the type gives you (but this is quite commoin in TypeScript).

### matchAll(chemins, pathname)

> Given an object of `Chemin` and a `pathname` return an new object with the result of `match` for each keys

```ts
const chemins = {
  home: chemin('home'),
  workspace: chemin('workspace', pString('tenant')),
  workspaceSettings: chemin('workspace', pString('tenant'), 'settings'),
};

const match = matchAll(chemins, '/workspace/123/settings');
expect(match).toEqual({
  home: null,
  workspace: { rest: ['settings'], exact: false, params: { tenant: '123' } },
  workspaceSettings: { rest: [], exact: true, params: { tenant: '123' } },
});
```

### matchAllNested(chemins, pathname)

> Same as `matchAll` but also match nested objects

### extract(chemin)

> Return an array of all the `Chemin` it contains (as well as the `Chemin` itself).

```ts
import { Chemin } from '@dldc/chemin';

const admin = chemin('admin');
const adminUser = chemin(admin, 'user');

adminUser.extract(); // [adminUser, admin];
```

**Note**: You probably don't need this but it's used internally in `partialMatch`

### stringify(chemin, options)

> Return a string representation of the chemin.

```ts
import { Chemin, pNumber, pString, stringify } from '@dldc/chemin';

const postFragment = chemin('post', pNumber('postId'));
const postAdmin = chemin('admin', pString('userId'), postFragment, 'edit');

console.log(stringify(postAdmin)); // /admin/:userId/post/:postId(number)/edit
```

The option object accepts two `boolean` properties:

- `leadingSlash` (default `true`): Add a slash at the begining
- `trailingSlash` (default: `false`): Add a slash at the end

### matchFirst(chemins, pathname)

### matchFirstExact(chemins, pathname)

### namespace(base, chemins)

### prefix(prefix, chemins)
