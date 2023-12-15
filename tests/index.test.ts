import { describe, expect, test } from 'vitest';
import type { IChemin, TCheminMatchMaybe } from '../src/mod';
import {
  chemin,
  cheminFactory,
  equal,
  pConstant,
  pInteger,
  pMultiple,
  pNumber,
  pOptional,
  pOptionalConst,
  pOptionalString,
  pString,
  splitPathname,
} from '../src/mod';

test('Serialize chemin', () => {
  const c = chemin('admin', pString('user'), pMultiple(pNumber('nums')));
  expect(c.stringify()).toBe('/admin/:user/:nums(number)*');
});

describe('Make sure different chemins return the correct match', () => {
  const data: Array<{
    chemin: IChemin;
    tests: Array<[string, TCheminMatchMaybe<any>]>;
  }> = [
    {
      chemin: chemin(),
      tests: [
        ['/', { params: {}, rest: [], exact: true }],
        ['//', { params: {}, rest: [''], exact: false }],
        ['', { params: {}, rest: [], exact: true }],
        ['/foo', { params: {}, rest: ['foo'], exact: false }],
        ['/foo/', { params: {}, rest: ['foo'], exact: false }],
        ['/foo/bar', { params: {}, rest: ['foo', 'bar'], exact: false }],
        ['/foo/bar/', { params: {}, rest: ['foo', 'bar'], exact: false }],
      ],
    },
    {
      chemin: chemin('admin'),
      tests: [
        ['/', null],
        ['', null],
        ['/admin', { params: {}, rest: [], exact: true }],
        ['/admin/', { params: {}, rest: [], exact: true }],
        ['/admin/home', { params: {}, rest: ['home'], exact: false }],
        ['/admin/home/', { params: {}, rest: ['home'], exact: false }],
        ['/adminnnn/', null],
        ['/admi', null],
      ],
    },
    {
      chemin: chemin('admin', pOptional(pString('tool'))),
      tests: [
        ['/', null],
        ['', null],
        ['/admin', { params: { tool: { present: false } }, rest: [], exact: true }],
        ['/admin/', { params: { tool: { present: false } }, rest: [], exact: true }],
        ['/admin/home', { params: { tool: { present: true, value: 'home' } }, rest: [], exact: true }],
        [
          '/admin/blabla/then',
          {
            params: { tool: { present: true, value: 'blabla' } },
            rest: ['then'],
            exact: false,
          },
        ],
      ],
    },
  ];

  data.forEach((data) => {
    describe(`Test ${data.chemin.stringify()}`, () => {
      data.tests.forEach((v) => {
        test(`'${v[0]}'`, () => {
          expect(data.chemin.match(v[0])).toEqual(v[1]);
        });
      });
    });
  });
});

describe('matchExact', () => {
  test('empty chemin', () => {
    const empty = chemin();

    expect(empty.matchExact('')).toEqual({});
    expect(empty.matchExact('/')).toEqual({});
    expect(empty.matchExact('/foo')).toEqual(null);
  });

  test('optional /foo/bar?', () => {
    const c = chemin('foo', pOptionalConst('bar'));

    expect(c.matchExact('/foo')).toEqual({ bar: false });
    expect(c.matchExact('/foo/bar')).toEqual({ bar: true });
    expect(c.matchExact('/foo/bar/baz')).toEqual(null);
  });
});

test('extract chemins', () => {
  const empty = chemin();
  const post = chemin(empty, pConstant('post'));
  const postFragment = chemin(post, pNumber('postId'));
  const postAdmin = chemin('admin', pString('userId'), postFragment, 'edit');

  const result = postAdmin.extract();
  expect(result.length).toBe(4);
  expect(result[0]).toBe(postAdmin);
  expect(result[1]).toBe(postFragment);
  expect(result[2]).toBe(post);
  expect(result[3]).toBe(empty);
});

test('serialize', () => {
  const empty = chemin();
  const post = chemin(empty, pConstant('post'));
  const postFragment = chemin(post, pNumber('postId'));
  const postAdmin = chemin('admin', pString('userId'), postFragment, 'edit');

  expect(empty.serialize()).toBe('/');
  expect(post.serialize()).toBe('/post');
  expect(postFragment.serialize({ postId: 42 })).toBe('/post/42');
  expect(postAdmin.serialize({ postId: 42, userId: 'etienne' })).toBe('/admin/etienne/post/42/edit');
});

test('serialize options', () => {
  const empty = chemin();
  const post = chemin(empty, pConstant('post'));
  const postFragment = chemin(post, pNumber('postId'));
  const postAdmin = chemin('admin', pString('userId'), postFragment, 'edit');
  expect(postAdmin.serialize({ postId: 42, userId: 'etienne' }, { leadingSlash: false, trailingSlash: true })).toBe(
    'admin/etienne/post/42/edit/',
  );
  expect(empty.serialize(null, { leadingSlash: false, trailingSlash: true })).toBe('/');
  expect(empty.serialize(null, { leadingSlash: true, trailingSlash: true })).toBe('/');
  expect(empty.serialize(null, { leadingSlash: false, trailingSlash: false })).toBe('');
});

test('stringify', () => {
  const empty = chemin();
  const post = chemin(empty, pConstant('post'));
  const postFragment = chemin(post, pNumber('postId'));
  const postAdmin = chemin('admin', pString('userId'), postFragment, 'edit');
  expect(empty.stringify()).toBe('/');
  expect(post.stringify()).toBe('/post');
  expect(postFragment.stringify()).toBe('/post/:postId(number)');
  expect(postAdmin.stringify()).toBe('/admin/:userId/post/:postId(number)/edit');
});

test('createCreator', () => {
  const chemin = cheminFactory({
    leadingSlash: false,
    trailingSlash: true,
  });
  const empty = chemin();
  const post = chemin(empty, pConstant('post'));
  const postFragment = chemin(post, pNumber('postId'));
  const postAdmin = chemin('admin', pString('userId'), postFragment, 'edit');
  expect(empty.serialize()).toBe('/');
  expect(post.serialize()).toBe('post/');
  expect(postFragment.serialize({ postId: 42 })).toBe('post/42/');
  expect(postAdmin.serialize({ postId: 42, userId: 'etienne' })).toBe('admin/etienne/post/42/edit/');
});

test('extract twice should return the same array', () => {
  const c = chemin('foo', 'bar', pOptionalConst('baz'));
  const ext1 = c.extract();
  const ext2 = c.extract();
  expect(ext1).toBe(ext2);
});

test('match usung splitPathname', () => {
  const c = chemin('foo', 'bar', pOptionalConst('baz'));
  const parts = splitPathname('/foo/bar');
  expect(c.match(parts)).toEqual({ params: { baz: false }, rest: [], exact: true });
});

test('splitPathname without trainlingSlash', () => {
  const parts = splitPathname('foo/bar');
  expect(parts).toEqual(['foo', 'bar']);
});

test('serialize/stringify with option', () => {
  const c = chemin('foo', 'bar', pOptionalConst('baz'));
  expect(c.serialize({ baz: true }, { trailingSlash: true })).toEqual('/foo/bar/baz/');
  expect(c.stringify({ trailingSlash: true })).toEqual('/foo/bar/baz?/');
});

test('serialize composed', () => {
  const c = chemin(chemin('foo', 'bar'), pOptionalConst('baz'));
  expect(c.serialize({ baz: true }, { trailingSlash: true })).toEqual('/foo/bar/baz/');
});

test('use the same chemin twice', () => {
  const base = chemin('foo', 'bar');
  const c = chemin(base, base);
  expect(c.serialize()).toEqual('/foo/bar/foo/bar');
  expect(c.extract().length).toEqual(2);
  expect(c.serialize(null, { trailingSlash: true })).toEqual('/foo/bar/foo/bar/');
  expect(c.match('/foo/bar/foo/bar')).toEqual({ params: {}, rest: [], exact: true });
  expect(c.match('/foo/bar')).toEqual(null);
});

describe('build in CheminParams', () => {
  test('constant', () => {
    const c = chemin(pConstant('foo'));
    expect(c.match('/')).toEqual(null);
    expect(c.match('/foo')).toEqual({ params: {}, rest: [], exact: true });
    expect(c.match('/foo/bar')).toEqual({ params: {}, rest: ['bar'], exact: false });
    expect(c.match('/fooo/foo/bar')).toEqual(null);
    expect(c.match('')).toEqual(null);
    expect(c.serialize()).toEqual('/foo');
  });

  test('integer', () => {
    const c = chemin(pInteger('num'));
    expect(c.match('/45')).toEqual({ params: { num: 45 }, rest: [], exact: true });
    expect(c.match('/45/')).toEqual({ params: { num: 45 }, rest: [], exact: true });
    expect(c.match('/45/foo')).toEqual({ params: { num: 45 }, rest: ['foo'], exact: false });
    expect(c.match('/45/999')).toEqual({ params: { num: 45 }, rest: ['999'], exact: false });
    expect(c.match('/')).toEqual(null);
    expect(c.match('')).toEqual(null);
    expect(c.match('/3.0')).toEqual(null);
    expect(c.match('/3.14')).toEqual(null);
    expect(c.match('/3,14')).toEqual(null);
    expect(c.match('/43hdhdhd')).toEqual(null);
    expect(c.match('/Infinity')).toEqual(null);
    expect(c.match('/10e2')).toEqual(null);
    expect(c.serialize({ num: 43 })).toEqual('/43');
    expect(() => c.serialize({ num: 3.14 })).toThrow();
    expect(() => c.serialize({ num: 'bar' } as any)).toThrow();
    expect(c.stringify()).toEqual('/:num(interger)');
  });

  test('integer (strict: false)', () => {
    const c = chemin(pInteger('num', { strict: false }));
    expect(c.match('/')).toEqual(null);
    expect(c.match('/45')).toEqual({ params: { num: 45 }, rest: [], exact: true });
    expect(c.match('/45/')).toEqual({ params: { num: 45 }, rest: [], exact: true });
    expect(c.match('/45/foo')).toEqual({ params: { num: 45 }, rest: ['foo'], exact: false });
    expect(c.match('/45/999')).toEqual({ params: { num: 45 }, rest: ['999'], exact: false });
    expect(c.match('/3.14')).toEqual({ params: { num: 3 }, rest: [], exact: true });
    expect(c.match('/3,14')).toEqual({ params: { num: 3 }, rest: [], exact: true });
    expect(c.match('/3.0')).toEqual({ params: { num: 3 }, rest: [], exact: true });
    expect(c.match('/43hdhdhd')).toEqual({ params: { num: 43 }, rest: [], exact: true });
    expect(c.match('')).toEqual(null);
    expect(c.serialize({ num: 3 })).toEqual('/3');
  });

  test('number', () => {
    const c = chemin(pNumber('num'));
    expect(c.match('/')).toEqual(null);
    expect(c.match('/45')).toEqual({ params: { num: 45 }, rest: [], exact: true });
    expect(c.match('/45/')).toEqual({ params: { num: 45 }, rest: [], exact: true });
    expect(c.match('/45/foo')).toEqual({ params: { num: 45 }, rest: ['foo'], exact: false });
    expect(c.match('/45/999')).toEqual({ params: { num: 45 }, rest: ['999'], exact: false });
    expect(c.match('/3.14')).toEqual({ params: { num: 3.14 }, rest: [], exact: true });
    expect(c.match('/3,14')).toEqual({ params: { num: 3 }, rest: [], exact: true });
    expect(c.match('/43hdhdhd')).toEqual({ params: { num: 43 }, rest: [], exact: true });
    expect(c.match('')).toEqual(null);
    expect(c.match('/Infinity')).toEqual({ params: { num: Infinity }, rest: [], exact: true });
    expect(c.match('/10e2')).toEqual({ params: { num: 1000 }, rest: [], exact: true });
    expect(c.serialize({ num: 3.1415 })).toEqual('/3.1415');
  });

  test('string', () => {
    const c = chemin(pString('str'));
    expect(c.match('/')).toEqual(null);
    expect(c.match('/foo')).toEqual({ params: { str: 'foo' }, rest: [], exact: true });
    expect(c.match('/foo/bar')).toEqual({ params: { str: 'foo' }, rest: ['bar'], exact: false });
    expect(c.match('/45')).toEqual({ params: { str: '45' }, rest: [], exact: true });
    expect(c.match('')).toEqual(null);
    expect(c.serialize({ str: 'hey' })).toEqual('/hey');
  });

  test('optional', () => {
    const c = chemin(pOptional(pInteger('num')));
    expect(c.match('/')).toEqual({ params: { num: { present: false } }, rest: [], exact: true });
    expect(c.match('/foo')).toEqual({ params: { num: { present: false } }, rest: ['foo'], exact: false });
    expect(c.match('/foo/bar')).toEqual({
      params: { num: { present: false } },
      rest: ['foo', 'bar'],
      exact: false,
    });
    expect(c.match('/45')).toEqual({
      params: { num: { present: true, value: 45 } },
      rest: [],
      exact: true,
    });
    expect(c.match('/45/foo')).toEqual({
      params: { num: { present: true, value: 45 } },
      rest: ['foo'],
      exact: false,
    });
    expect(c.match('')).toEqual({ params: { num: { present: false } }, rest: [], exact: true });
    expect(c.serialize({ num: { present: true, value: 54 } })).toEqual('/54');
    expect(c.serialize({ num: { present: false } })).toEqual('/');
    expect(c.stringify()).toEqual('/:num(interger)?');
  });

  test('optionalConst', () => {
    const c = chemin(pOptionalConst('str', 'some-string'));
    expect(c.match('/')).toEqual({ params: { str: false }, rest: [], exact: true });
    expect(c.match('')).toEqual({ params: { str: false }, rest: [], exact: true });
    expect(c.match('/some-string')).toEqual({ params: { str: true }, rest: [], exact: true });
    expect(c.match('/some-string/bar')).toEqual({ params: { str: true }, rest: ['bar'], exact: false });
    expect(c.match('/foo/some-string')).toEqual({
      params: { str: false },
      rest: ['foo', 'some-string'],
      exact: false,
    });
    expect(c.serialize({ str: true })).toEqual('/some-string');
    expect(c.serialize({ str: false })).toEqual('/');
    expect(c.stringify()).toEqual('/some-string?');
  });

  test('optionalString', () => {
    const c = chemin(pOptionalString('str'));
    expect(c.match('/')).toEqual({ params: { str: false }, rest: [], exact: true });
    expect(c.match('')).toEqual({ params: { str: false }, rest: [], exact: true });
    expect(c.match('/foo')).toEqual({ params: { str: 'foo' }, rest: [], exact: true });
    expect(c.match('/foo/bar')).toEqual({ params: { str: 'foo' }, rest: ['bar'], exact: false });
    expect(c.match('/foo/bar')).toEqual({ params: { str: 'foo' }, rest: ['bar'], exact: false });
    expect(c.serialize({ str: 'hey' })).toEqual('/hey');
    expect(c.serialize({ str: false })).toEqual('/');
    expect(c.stringify()).toEqual('/:str?');
  });

  test('multiple', () => {
    const c = chemin(pMultiple(pString('categories')));
    expect(c.match('/')).toEqual({ params: { categories: [] }, rest: [], exact: true });
    expect(c.match('')).toEqual({ params: { categories: [] }, rest: [], exact: true });
    expect(c.match('/some/foo/bar')).toEqual({
      params: { categories: ['some', 'foo', 'bar'] },
      rest: [],
      exact: true,
    });
    expect(c.match('/cat1/cat2')).toEqual({
      params: { categories: ['cat1', 'cat2'] },
      rest: [],
      exact: true,
    });
    expect(c.match('/single')).toEqual({
      params: { categories: ['single'] },
      rest: [],
      exact: true,
    });
    expect(c.serialize({ categories: ['hey'] })).toEqual('/hey');
    expect(c.serialize({ categories: [] })).toEqual('/');
    expect(c.stringify()).toEqual('/:categories*');
  });

  test('multiple (atLeastOne: true)', () => {
    const c = chemin(pMultiple(pString('categories'), true));
    expect(c.match('/')).toEqual(null);
    expect(c.match('')).toEqual(null);
    expect(c.match('/some/foo/bar')).toEqual({
      params: { categories: ['some', 'foo', 'bar'] },
      rest: [],
      exact: true,
    });
    expect(c.match('/cat1/cat2')).toEqual({
      params: { categories: ['cat1', 'cat2'] },
      rest: [],
      exact: true,
    });
    expect(c.match('/single')).toEqual({
      params: { categories: ['single'] },
      rest: [],
      exact: true,
    });
    expect(c.serialize({ categories: ['hey'] })).toEqual('/hey');
    expect(c.stringify()).toEqual('/:categories+');
  });
});

test('equal', () => {
  expect(equal(chemin(), chemin())).toBe(true);
  expect(equal(chemin('foo'), chemin('foo'))).toBe(true);
  const c = chemin(pInteger('num'));
  expect(equal(c, c)).toBe(true);
  expect(equal(chemin(pInteger('num')), chemin(pInteger('num')))).toBe(true);
  const ch1 = chemin('api');
  const ch2 = chemin(ch1, 'foo');
  const ch3 = chemin(ch1, 'foo');
  expect(equal(ch2, ch3)).toBe(true);
  // compare twice to get cached flattened
  expect(equal(ch2, ch3)).toBe(true);
  expect(
    equal(
      chemin(
        pInteger('int'),
        pString('str'),
        pNumber('num'),
        pOptional(pConstant('yolo')),
        pOptionalConst('hey'),
        pOptionalString('youpi'),
        pMultiple(pConstant('a')),
      ),
      chemin(
        pInteger('int'),
        pString('str'),
        pNumber('num'),
        pOptional(pConstant('yolo')),
        pOptionalConst('hey'),
        pOptionalString('youpi'),
        pMultiple(pConstant('a')),
      ),
    ),
  ).toBe(true);
});

test('cheminEqual => false', () => {
  expect(equal(chemin('foo'), chemin('bar'))).toBe(false);
  expect(equal(chemin('foo', 'hey'), chemin('bar'))).toBe(false);
  expect(equal(chemin(pNumber('num')), chemin(pInteger('num')))).toBe(false);
  expect(equal(chemin(pNumber('num')), chemin(pNumber('num2')))).toBe(false);
});
