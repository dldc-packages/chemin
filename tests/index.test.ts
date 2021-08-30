import {
  Chemin,
  CheminParam as P,
  CheminMatchMaybe,
  splitPathname,
  cheminsEqual,
} from '../src/mod';

test('Serialize chemin', () => {
  const chemin = Chemin.create('admin', P.string('user'), P.multiple(P.number('nums')));
  expect(chemin.stringify()).toBe('/admin/:user/:nums(number)*');
});

test('Parse then stringify', () => {
  const chemin = Chemin.parse('/user/settings/:setting/advanced?/:id?');
  expect(chemin.stringify()).toBe('/user/settings/:setting/advanced?/:id?');
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
        ['/foo/bar/', { params: {}, rest: ['foo', 'bar'] }],
      ],
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
        ['/admi', false],
      ],
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
            rest: ['then'],
          },
        ],
      ],
    },
  ];

  data.forEach((data) => {
    describe(`Test ${data.chemin}`, () => {
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

test('stringify', () => {
  const empty = Chemin.create();
  const post = Chemin.create(empty, P.constant('post'));
  const postFragment = Chemin.create(post, P.number('postId'));
  const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');
  expect(empty.stringify()).toBe('/');
  expect(post.stringify()).toBe('/post');
  expect(postFragment.stringify()).toBe('/post/:postId(number)');
  expect(postAdmin.stringify()).toBe('/admin/:userId/post/:postId(number)/edit');
});

test('createCreator', () => {
  const create = Chemin.createCreator({
    leadingSlash: false,
    trailingSlash: true,
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

test('parse with a custom creator', () => {
  const creator = Chemin.createCreator({ leadingSlash: false, trailingSlash: true });
  const chemin = Chemin.parse<{ id: string }>('/some/path/:id', creator);
  expect(chemin.stringify()).toEqual('some/path/:id/');
  expect(chemin.serialize({ id: 'foo' })).toEqual('some/path/foo/');
});

test('extract twice should return the same array', () => {
  const chemin = Chemin.create('foo', 'bar', P.optionalConst('baz'));
  const ext1 = chemin.extract();
  const ext2 = chemin.extract();
  expect(ext1).toBe(ext2);
});

test('match usung splitPathname', () => {
  const chemin = Chemin.create('foo', 'bar', P.optionalConst('baz'));
  const parts = splitPathname('/foo/bar');
  expect(chemin.match(parts)).toEqual({ params: { baz: false }, rest: [] });
});

test('splitPathname without trainlingSlash', () => {
  const parts = splitPathname('foo/bar');
  expect(parts).toEqual(['foo', 'bar']);
});

test('serialize/stringify with option', () => {
  const chemin = Chemin.create('foo', 'bar', P.optionalConst('baz'));
  expect(chemin.serialize({ baz: true }, { trailingSlash: true })).toEqual('/foo/bar/baz/');
  expect(chemin.stringify({ trailingSlash: true })).toEqual('/foo/bar/baz?/');
});

test('serialize composed', () => {
  const chemin = Chemin.create(Chemin.create('foo', 'bar'), P.optionalConst('baz'));
  expect(chemin.serialize({ baz: true }, { trailingSlash: true })).toEqual('/foo/bar/baz/');
});

test('use the same chemin twice', () => {
  const base = Chemin.create('foo', 'bar');
  const chemin = Chemin.create(base, base);
  expect(chemin.serialize()).toEqual('/foo/bar/foo/bar');
  expect(chemin.extract().length).toEqual(2);
  expect(chemin.serialize(null, { trailingSlash: true })).toEqual('/foo/bar/foo/bar/');
  expect(chemin.match('/foo/bar/foo/bar')).toEqual({ params: {}, rest: [] });
  expect(chemin.match('/foo/bar')).toEqual(false);
});

describe('build in CheminParams', () => {
  test('constant', () => {
    const chemin = Chemin.create(P.constant('foo'));
    expect(chemin.match('/')).toEqual(false);
    expect(chemin.match('/foo')).toEqual({ params: {}, rest: [] });
    expect(chemin.match('/foo/bar')).toEqual({ params: {}, rest: ['bar'] });
    expect(chemin.match('/fooo/foo/bar')).toEqual(false);
    expect(chemin.match('')).toEqual(false);
    expect(chemin.serialize()).toEqual('/foo');
  });

  test('integer', () => {
    const chemin = Chemin.create(P.integer('num'));
    expect(chemin.match('/45')).toEqual({ params: { num: 45 }, rest: [] });
    expect(chemin.match('/45/')).toEqual({ params: { num: 45 }, rest: [] });
    expect(chemin.match('/45/foo')).toEqual({ params: { num: 45 }, rest: ['foo'] });
    expect(chemin.match('/45/999')).toEqual({ params: { num: 45 }, rest: ['999'] });
    expect(chemin.match('/')).toEqual(false);
    expect(chemin.match('')).toEqual(false);
    expect(chemin.match('/3.14')).toEqual(false);
    expect(chemin.match('/3,14')).toEqual(false);
    expect(chemin.match('/43hdhdhd')).toEqual(false);
    expect(chemin.match('/Infinity')).toEqual(false);
    expect(chemin.match('/10e2')).toEqual(false);
    expect(chemin.serialize({ num: 43 })).toEqual('/43');
    expect(() => chemin.serialize({ num: 3.14 })).toThrow();
    expect(() => chemin.serialize({ num: 'bar' } as any)).toThrow();
    expect(chemin.stringify()).toEqual('/:num(interger)');
  });

  test('integer (strict:false)', () => {
    const chemin = Chemin.create(P.integer('num', { strict: false }));
    expect(chemin.match('/')).toEqual(false);
    expect(chemin.match('/45')).toEqual({ params: { num: 45 }, rest: [] });
    expect(chemin.match('/45/')).toEqual({ params: { num: 45 }, rest: [] });
    expect(chemin.match('/45/foo')).toEqual({ params: { num: 45 }, rest: ['foo'] });
    expect(chemin.match('/45/999')).toEqual({ params: { num: 45 }, rest: ['999'] });
    expect(chemin.match('/3.14')).toEqual({ params: { num: 3 }, rest: [] });
    expect(chemin.match('/3,14')).toEqual({ params: { num: 3 }, rest: [] });
    expect(chemin.match('/43hdhdhd')).toEqual({ params: { num: 43 }, rest: [] });
    expect(chemin.match('')).toEqual(false);
    expect(chemin.serialize({ num: 3 })).toEqual('/3');
  });

  test('number', () => {
    const chemin = Chemin.create(P.number('num'));
    expect(chemin.match('/')).toEqual(false);
    expect(chemin.match('/45')).toEqual({ params: { num: 45 }, rest: [] });
    expect(chemin.match('/45/')).toEqual({ params: { num: 45 }, rest: [] });
    expect(chemin.match('/45/foo')).toEqual({ params: { num: 45 }, rest: ['foo'] });
    expect(chemin.match('/45/999')).toEqual({ params: { num: 45 }, rest: ['999'] });
    expect(chemin.match('/3.14')).toEqual({ params: { num: 3.14 }, rest: [] });
    expect(chemin.match('/3,14')).toEqual({ params: { num: 3 }, rest: [] });
    expect(chemin.match('/43hdhdhd')).toEqual({ params: { num: 43 }, rest: [] });
    expect(chemin.match('')).toEqual(false);
    expect(chemin.match('/Infinity')).toEqual({ params: { num: Infinity }, rest: [] });
    expect(chemin.match('/10e2')).toEqual({ params: { num: 1000 }, rest: [] });
    expect(chemin.serialize({ num: 3.1415 })).toEqual('/3.1415');
  });

  test('string', () => {
    const chemin = Chemin.create(P.string('str'));
    expect(chemin.match('/')).toEqual(false);
    expect(chemin.match('/foo')).toEqual({ params: { str: 'foo' }, rest: [] });
    expect(chemin.match('/foo/bar')).toEqual({ params: { str: 'foo' }, rest: ['bar'] });
    expect(chemin.match('/45')).toEqual({ params: { str: '45' }, rest: [] });
    expect(chemin.match('')).toEqual(false);
    expect(chemin.serialize({ str: 'hey' })).toEqual('/hey');
  });

  test('optional', () => {
    const chemin = Chemin.create(P.optional(P.integer('num')));
    expect(chemin.match('/')).toEqual({ params: { num: { present: false } }, rest: [] });
    expect(chemin.match('/foo')).toEqual({ params: { num: { present: false } }, rest: ['foo'] });
    expect(chemin.match('/foo/bar')).toEqual({
      params: { num: { present: false } },
      rest: ['foo', 'bar'],
    });
    expect(chemin.match('/45')).toEqual({
      params: { num: { present: true, value: 45 } },
      rest: [],
    });
    expect(chemin.match('/45/foo')).toEqual({
      params: { num: { present: true, value: 45 } },
      rest: ['foo'],
    });
    expect(chemin.match('')).toEqual({ params: { num: { present: false } }, rest: [] });
    expect(chemin.serialize({ num: { present: true, value: 54 } })).toEqual('/54');
    expect(chemin.serialize({ num: { present: false } })).toEqual('/');
    expect(chemin.stringify()).toEqual('/:num(interger)?');
  });

  test('optionalConst', () => {
    const chemin = Chemin.create(P.optionalConst('str', 'some-string'));
    expect(chemin.match('/')).toEqual({ params: { str: false }, rest: [] });
    expect(chemin.match('')).toEqual({ params: { str: false }, rest: [] });
    expect(chemin.match('/some-string')).toEqual({ params: { str: true }, rest: [] });
    expect(chemin.match('/some-string/bar')).toEqual({ params: { str: true }, rest: ['bar'] });
    expect(chemin.match('/foo/some-string')).toEqual({
      params: { str: false },
      rest: ['foo', 'some-string'],
    });
    expect(chemin.serialize({ str: true })).toEqual('/some-string');
    expect(chemin.serialize({ str: false })).toEqual('/');
    expect(chemin.stringify()).toEqual('/some-string?');
  });

  test('optionalString', () => {
    const chemin = Chemin.create(P.optionalString('str'));
    expect(chemin.match('/')).toEqual({ params: { str: false }, rest: [] });
    expect(chemin.match('')).toEqual({ params: { str: false }, rest: [] });
    expect(chemin.match('/foo')).toEqual({ params: { str: 'foo' }, rest: [] });
    expect(chemin.match('/foo/bar')).toEqual({ params: { str: 'foo' }, rest: ['bar'] });
    expect(chemin.match('/foo/bar')).toEqual({ params: { str: 'foo' }, rest: ['bar'] });
    expect(chemin.serialize({ str: 'hey' })).toEqual('/hey');
    expect(chemin.serialize({ str: false })).toEqual('/');
    expect(chemin.stringify()).toEqual('/:str?');
  });

  test('multiple', () => {
    const chemin = Chemin.create(P.multiple(P.string('categories')));
    expect(chemin.match('/')).toEqual({ params: { categories: [] }, rest: [] });
    expect(chemin.match('')).toEqual({ params: { categories: [] }, rest: [] });
    expect(chemin.match('/some/foo/bar')).toEqual({
      params: { categories: ['some', 'foo', 'bar'] },
      rest: [],
    });
    expect(chemin.match('/cat1/cat2')).toEqual({
      params: { categories: ['cat1', 'cat2'] },
      rest: [],
    });
    expect(chemin.match('/single')).toEqual({
      params: { categories: ['single'] },
      rest: [],
    });
    expect(chemin.serialize({ categories: ['hey'] })).toEqual('/hey');
    expect(chemin.serialize({ categories: [] })).toEqual('/');
    expect(chemin.stringify()).toEqual('/:categories*');
  });

  test('multiple (atLeastOne: true)', () => {
    const chemin = Chemin.create(P.multiple(P.string('categories'), true));
    expect(chemin.match('/')).toEqual(false);
    expect(chemin.match('')).toEqual(false);
    expect(chemin.match('/some/foo/bar')).toEqual({
      params: { categories: ['some', 'foo', 'bar'] },
      rest: [],
    });
    expect(chemin.match('/cat1/cat2')).toEqual({
      params: { categories: ['cat1', 'cat2'] },
      rest: [],
    });
    expect(chemin.match('/single')).toEqual({
      params: { categories: ['single'] },
      rest: [],
    });
    expect(chemin.serialize({ categories: ['hey'] })).toEqual('/hey');
    expect(chemin.stringify()).toEqual('/:categories+');
  });
});

test('cheminEqual', () => {
  expect(cheminsEqual(Chemin.create(), Chemin.create())).toBe(true);
  expect(cheminsEqual(Chemin.create('foo'), Chemin.create('foo'))).toBe(true);
  const chemin = Chemin.create(P.integer('num'));
  expect(cheminsEqual(chemin, chemin)).toBe(true);
  expect(cheminsEqual(Chemin.create(P.integer('num')), Chemin.create(P.integer('num')))).toBe(true);
  const ch1 = Chemin.create('api');
  const ch2 = Chemin.create(ch1, 'foo');
  const ch3 = Chemin.create(ch1, 'foo');
  expect(cheminsEqual(ch2, ch3)).toBe(true);
  // compare twice to get cached flattened
  expect(cheminsEqual(ch2, ch3)).toBe(true);
  expect(ch2.equal(ch3)).toBe(true);
  expect(
    cheminsEqual(
      Chemin.create(
        P.integer('int'),
        P.string('str'),
        P.number('num'),
        P.optional(P.constant('yolo')),
        P.optionalConst('hey'),
        P.optionalString('youpi'),
        P.multiple(P.constant('a'))
      ),
      Chemin.create(
        P.integer('int'),
        P.string('str'),
        P.number('num'),
        P.optional(P.constant('yolo')),
        P.optionalConst('hey'),
        P.optionalString('youpi'),
        P.multiple(P.constant('a'))
      )
    )
  ).toBe(true);
});

test('cheminEqual => false', () => {
  expect(cheminsEqual(Chemin.create('foo'), Chemin.create('bar'))).toBe(false);
  expect(cheminsEqual(Chemin.create('foo', 'hey'), Chemin.create('bar'))).toBe(false);
  expect(cheminsEqual(Chemin.create(P.number('num')), Chemin.create(P.integer('num')))).toBe(false);
  expect(cheminsEqual(Chemin.create(P.number('num')), Chemin.create(P.number('num2')))).toBe(false);
});
