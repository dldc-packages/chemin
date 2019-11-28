import { Chemin, CheminParam as P, CheminMatchMaybe } from '../src';

test('Serialize chemin', () => {
  const chemin = Chemin.create('admin', P.string('user'), P.multiple(P.number('nums')));
  expect(chemin.toString()).toBe('/admin/:user/:nums(number)*');
});

test('Parse then toString', () => {
  const chemin = Chemin.parse('/user/settings/:setting/advanced?');
  expect(chemin.toString()).toBe('/user/settings/:setting/advanced?');
});

describe('Make sure different chemins return the correct match', () => {
  const data: Array<{
    chemin: Chemin;
    tests: Array<[string, CheminMatchMaybe<any>]>;
  }> = [
    {
      chemin: Chemin.parse('/'),
      tests: [
        ['/', { params: {}, rest: [] }],
        ['//', { params: {}, rest: [''] }],
        ['', { params: {}, rest: [] }],
        ['/foo', { params: {}, rest: ['foo'] }],
        ['/foo/', { params: {}, rest: ['foo'] }],
        ['/foo/bar', { params: {}, rest: ['foo', 'bar'] }],
        ['/foo/bar/', { params: {}, rest: ['foo', 'bar'] }]
      ]
    },
    {
      chemin: Chemin.parse('/admin'),
      tests: [
        ['/', false],
        ['', false],
        ['/admin', { params: {}, rest: [] }],
        ['/admin/', { params: {}, rest: [] }],
        ['/admin/home', { params: {}, rest: ['home'] }],
        ['/admin/home/', { params: {}, rest: ['home'] }],
        ['/adminnnn/', false],
        ['/admi', false]
      ]
    },
    {
      chemin: Chemin.create('admin', P.optional(P.string('tool'))),
      tests: [
        ['/', false],
        ['', false],
        ['/admin', { params: { tool: { present: false } }, rest: [] }],
        ['/admin/', { params: { tool: { present: false } }, rest: [] }],
        ['/admin/home', { params: { tool: { present: true, value: 'home' } }, rest: [] }],
        [
          '/admin/blabla/then',
          {
            params: { tool: { present: true, value: 'blabla' } },
            rest: ['then']
          }
        ]
      ]
    }
  ];

  data.forEach(data => {
    describe(`Test ${data.chemin}`, () => {
      data.tests.forEach(v => {
        test(`'${v[0]}'`, () => {
          expect(data.chemin.match(v[0])).toEqual(v[1]);
        });
      });
    });
  });
});

describe('matchExact', () => {
  test('empty chemin', () => {
    const empty = Chemin.create();

    expect(empty.matchExact('')).toEqual({});
    expect(empty.matchExact('/')).toEqual({});
    expect(empty.matchExact('/foo')).toEqual(false);
  });

  test('optional /foo/bar?', () => {
    const chemin = Chemin.create('foo', P.optionalConst('bar'));

    expect(chemin.matchExact('/foo')).toEqual({ bar: false });
    expect(chemin.matchExact('/foo/bar')).toEqual({ bar: true });
    expect(chemin.matchExact('/foo/bar/baz')).toEqual(false);
  });
});

test('extract chemins', () => {
  const empty = Chemin.create();
  const post = Chemin.create(empty, P.constant('post'));
  const postFragment = Chemin.create(post, P.number('postId'));
  const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');

  const result = postAdmin.extract();
  expect(result.length).toBe(4);
  expect(result[0]).toBe(postAdmin);
  expect(result[1]).toBe(postFragment);
  expect(result[2]).toBe(post);
  expect(result[3]).toBe(empty);
});

test('serialize', () => {
  const empty = Chemin.create();
  const post = Chemin.create(empty, P.constant('post'));
  const postFragment = Chemin.create(post, P.number('postId'));
  const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');

  expect(empty.serialize()).toBe('/');
  expect(post.serialize()).toBe('/post');
  expect(postFragment.serialize({ postId: 42 })).toBe('/post/42');
  expect(postAdmin.serialize({ postId: 42, userId: 'etienne' })).toBe(
    '/admin/etienne/post/42/edit'
  );
});

test('serialize options', () => {
  const empty = Chemin.create();
  const post = Chemin.create(empty, P.constant('post'));
  const postFragment = Chemin.create(post, P.number('postId'));
  const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');
  expect(
    postAdmin.serialize(
      { postId: 42, userId: 'etienne' },
      { leadingSlash: false, trailingSlash: true }
    )
  ).toBe('admin/etienne/post/42/edit/');
  expect(empty.serialize(null, { leadingSlash: false, trailingSlash: true })).toBe('/');
  expect(empty.serialize(null, { leadingSlash: true, trailingSlash: true })).toBe('/');
  expect(empty.serialize(null, { leadingSlash: false, trailingSlash: false })).toBe('');
});

test('toString', () => {
  const empty = Chemin.create();
  const post = Chemin.create(empty, P.constant('post'));
  const postFragment = Chemin.create(post, P.number('postId'));
  const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');
  expect(empty.toString()).toBe('/');
  expect(post.toString()).toBe('/post');
  expect(postFragment.toString()).toBe('/post/:postId(number)');
  expect(postAdmin.toString()).toBe('/admin/:userId/post/:postId(number)/edit');
});

test('createCreator', () => {
  const create = Chemin.createCreator({
    leadingSlash: false,
    trailingSlash: true
  });
  const empty = create();
  const post = create(empty, P.constant('post'));
  const postFragment = create(post, P.number('postId'));
  const postAdmin = create('admin', P.string('userId'), postFragment, 'edit');
  expect(empty.serialize()).toBe('/');
  expect(post.serialize()).toBe('post/');
  expect(postFragment.serialize({ postId: 42 })).toBe('post/42/');
  expect(postAdmin.serialize({ postId: 42, userId: 'etienne' })).toBe(
    'admin/etienne/post/42/edit/'
  );
});
