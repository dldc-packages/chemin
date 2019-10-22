import { Chemin, CheminParams as P, CheminMatchResult } from '../src';

test('Serialize pattern', () => {
  const pattern = Chemin.create('admin', P.string('user'), P.multiple(P.number('nums')));
  expect(Chemin.stringify(pattern)).toBe('/admin/:user/:nums(number)*');
});

test('Parse then serialize', () => {
  const pattern = Chemin.parse('/user/settings/:setting/advanced?');
  expect(Chemin.stringify(pattern)).toBe('/user/settings/:setting/advanced?');
});

describe('Make sure different patterns return the correct match', () => {
  const data: Array<{ pattern: Chemin; tests: Array<[string, CheminMatchResult<any>]> }> = [
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
