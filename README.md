<p align="center">
  <img src="https://github.com/dldc-packages/chemin/raw/main/design/logo.png" width="900" alt="chemin logo">
</p>

# 🥾 Chemin

> A type-safe pattern builder & route matching library written in TypeScript

## Gist

```js
import { Chemin } from '@dldc/chemin';

const chemin = Chemin.parse('/admin/post/:postId/delete?');

console.log(chemin.match('/no/valid'));
// => null

console.log(chemin.match('/admin/post/e5t89u'));
// => { rest: [], exact: true, params: { postId: 'e5t89u', delete: false } }
```

## More advanced (and type-safe) patterns

Use the `Chemin.create` and `CheminParam` to build more complex **type-safe** paths !

```ts
import { Chemin, CheminParam as P } from '@dldc/chemin';

// admin/post/:postId(number)/delete?
const chemin = Chemin.create('admin', 'post', P.number('postId'), P.optionalConst('delete'));

console.log(chemin.match('/no/valid'));
// => null

const match = chemin.match('/admin/post/45');
console.log(match);
// => { rest: [], exact: true, params: { postId: 45, delete: false } }
// match.params is typed as { postId: number, delete: boolean } !
```

## Composition

You can use a `Chemin` inside another one to easily compose your routes !

```ts
import { Chemin, CheminParam as P } from '@dldc/chemin';

const postFragment = Chemin.create('post', P.number('postId'));
const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');

console.log(postAdmin.stringify()); // /admin/:userId/post/:postId(number)/edit
```

## Custom `CheminParam`

You can create your own `CheminParam` to better fit your application while keeping full type-safety !

```ts
import { Chemin, CheminParam } from '@dldc/chemin';

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
    serialize: (value) => value,
    stringify: () => `:${name}(id4)`,
  };
}

const path = Chemin.create('item', fourCharStringId('itemId'));
console.log(path.match('/item/a4e3t')); // null (5 char)
console.log(path.match('/item/A4e3')); // null (beacause A is uppercase)
console.log(path.match('/item/a4e3')); // { rest: [], exact: true, params: { itemId: 'a4e3' } }
```

> Take a look a [the custom-advanced.test.ts example](https://github.com/dldc-packages/chemin/blob/main/tests/custom-advanced.test.ts).
> and [the build-in CheminParam](https://github.com/dldc-packages/chemin/blob/main/src/CheminParam.ts).

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

### Chemin.partialMatch(chemin, match, part)

> This function let you extract the params of a chemin that part of another one

```ts
const workspace = Chemin.create('workspace', CheminParam.string('tenant'));

const home = Chemin.create('home');
const workspaceHome = Chemin.create(workspace, 'home');
const workspaceSettings = Chemin.create(workspace, 'settings');

const match1 = Chemin.partialMatch(workspaceHome, workspaceHome.match('/workspace/123/home'), workspace);
// match1 is typed as { tenant: string } | null
expect(match1).toMatchObject({ tenant: '123' });

const match2 = Chemin.partialMatch(workspaceSettings, workspaceSettings.match('/workspace/123/settings'), workspace);
expect(match2).toMatchObject({ tenant: '123' });

const match3 = Chemin.partialMatch(home, home.match('/home'), workspace);
expect(match3).toBe(null);
```

### Chemin.matchAll(chemins, pathname)

> Given an object of `Chemin` and a `pathname` return an new object with the result of `Chemin.match` fir each keys

```ts
const chemins = {
  home: Chemin.create('home'),
  workspace: Chemin.create('workspace', CheminParam.string('tenant')),
  workspaceSettings: Chemin.create('workspace', CheminParam.string('tenant'), 'settings'),
};

const match = Chemin.matchAll(chemins, '/workspace/123/settings');
expect(match).toEqual({
  home: null,
  workspace: { rest: ['settings'], exact: false, params: { tenant: '123' } },
  workspaceSettings: { rest: [], exact: true, params: { tenant: '123' } },
});
```

### Chemin.matchAllNested(chemins, pathname)

> Same as `Chemin.matchAll` but also match nested objects

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
const chemin = Chemin.create('admin', CheminParam.number('userId'), CheminParam.optionalConst('edit'));
chemin.serialize({ userId: 42, edit: true }); // /admin/42/edit
```

### chemin.match(pathname)

> Test a chemin against a pathanme

Accepts a `pathname` and return `null` or `TCheminMatchMaybe`.

- `pathname` can be either a string (`/admin/user/5`) or an array of strings (`['admin', 'user', '5']`)
- `TCheminMatchMaybe` is an object with three properties
  - `rest`: an array of string of the remaining parts of the pathname once the matching is done
  - `exact`: a boolean indicating if the match is exact or not (if `rest` is empty or not)
  - `params`: an object of params extracted from the matching

**Note**: When `pathname` is a `string`, it is splitted using the `splitPathname` function. This function is exported so you can use it to split your pathnames in the same way.

### chemin.matchExact(pathname)

Accepts the same arguments as `chemin.match` but return `null` if the path does not match or if `rest` is not empty, otherwise it returns the `params` object directly.

### chemin.extract()

Return an array of all the `Chemin` it contains (as well as the `Chemin` itself).

```ts
import { Chemin } from '@dldc/chemin';

const admin = Chemin.create('admin');
const adminUser = Chemin.create(admin, 'user');

adminUser.extract(); // [adminUser, admin];
```

**Note**: You probably don't need this but it's used internally in `Chemin.partialMatch`

### chemin.stringify()

Return a string representation of the chemin.

```ts
import { Chemin, CheminParam as P } from '@dldc/chemin';

const postFragment = Chemin.create('post', P.number('postId'));
const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');

console.log(postAdmin.stringify()); // /admin/:userId/post/:postId(number)/edit
```

### splitPathname(pathname)

> Split a pathname and prevent empty parts

Accepts a string and returns an array of strings.

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

The `options` parameter is optional and accepts a `strict` boolean property (`true` by default). When strict is set to `true` (the default) it will only match if the parsed number is the same as the raw value (so `1.0` or `42blabla` will not match).

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
