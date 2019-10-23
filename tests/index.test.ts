import { Chemin, CheminParams as P, CheminMatchMaybe } from '../dist';

test('Serialize pattern', () => {
  const pattern = Chemin.create('admin', P.string('user'), P.multiple(P.number('nums')));
  expect(Chemin.stringify(pattern)).toBe('/admin/:user/:nums(number)*');
});

test('Parse then serialize', () => {
  const pattern = Chemin.parse('/user/settings/:setting/advanced?');
  expect(Chemin.stringify(pattern)).toBe('/user/settings/:setting/advanced?');
});

describe('Make sure different patterns return the correct match', () => {
  const data: Array<{ pattern: Chemin; tests: Array<[string, CheminMatchMaybe<any>]> }> = [
    {
      pattern: Chemin.parse('/'),
      tests: [
        ['/', { params: {}, rest: [] }],
        ['', { params: {}, rest: [] }],
        ['/foo', { params: {}, rest: ['foo'] }],
        ['/foo/', { params: {}, rest: ['foo'] }],
        ['/foo/bar', { params: {}, rest: ['foo', 'bar'] }],
        ['/foo/bar/', { params: {}, rest: ['foo', 'bar'] }],
      ],
    },
    {
      pattern: Chemin.parse('/admin'),
      tests: [
        ['/', false],
        ['', false],
        ['/admin', { params: {}, rest: [] }],
        ['/admin/', { params: {}, rest: [] }],
        ['/admin/home', { params: {}, rest: ['home'] }],
        ['/admin/home/', { params: {}, rest: ['home'] }],
        ['/adminnnn/', false],
        ['/admi', false],
      ],
    },
    {
      pattern: Chemin.create('admin', P.optional(P.string('tool'))),
      tests: [
        ['/', false],
        ['', false],
        ['/admin', { params: { tool: { present: false } }, rest: [] }],
        ['/admin/', { params: { tool: { present: false } }, rest: [] }],
        ['/admin/home', { params: { tool: { present: true, value: 'home' } }, rest: [] }],
        ['/admin/blabla/then', { params: { tool: { present: true, value: 'blabla' } }, rest: ['then'] }],
      ],
    },
  ];

  data.forEach(data => {
    describe(`Test ${Chemin.stringify(data.pattern)}`, () => {
      data.tests.forEach(v => {
        test(`'${v[0]}'`, () => {
          expect(Chemin.match(data.pattern, v[0])).toEqual(v[1]);
        });
      });
    });
  });
});

test('serialize correctly', () => {
  const postFragment = Chemin.create('post', P.number('postId'));
  const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');

  expect(Chemin.stringify(postAdmin)).toBe('/admin/:userId/post/:postId(number)/edit');
});

test('extract chemins', () => {
  const empty = Chemin.create();
  const post = Chemin.create(empty, P.constant('post'));
  const postFragment = Chemin.create(post, P.number('postId'));
  const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');

  const result = Chemin.extract(postAdmin);
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
  expect(postAdmin.serialize({ postId: 42, userId: 'etienne' })).toBe('/admin/etienne/post/42/edit');
});
