import { describe, expect, test } from 'vitest';
import { chemin, matchAllNested, namespace, pConstant, pNumber, pOptional, pString, prefix } from '../src/mod';

test('matchAllNested', () => {
  const ROUTES = (() => {
    const home = chemin();
    const posts = chemin(home, 'posts');

    const postFragment = chemin('post', pNumber('postId'));

    const post = chemin(home, postFragment);
    const admin = chemin(home, 'admin');
    const adminPost = chemin(admin, postFragment, pOptional(pConstant('delete')));

    return {
      home,
      posts,
      post,
      admin: {
        home: admin,
        post: adminPost,
      },
    };
  })();

  function run(pathname: string) {
    const adminPostMatch = ROUTES.admin.post.matchExact(pathname);
    if (adminPostMatch) {
      return `Admin > Post (id: ${adminPostMatch.postId})${adminPostMatch.delete ? ' > Delete' : ''}`;
    }
    const routes = matchAllNested(ROUTES, pathname);
    if (routes.home?.exact) {
      return `Welcome Home`;
    }
    if (routes.post?.exact) {
      return `Post ${routes.post.params.postId}`;
    }
    if (routes.posts?.exact) {
      return `Posts`;
    }
    if (routes.admin.home?.exact) {
      return `Admin`;
    }
    return `Not Found`;
  }

  const results = [
    '/',
    '/admin',
    '/posts',
    '/post/43',
    '/post/2',
    '/admin/post',
    '/admin/post/42',
    '/yolo',
    '/post/egegegd',
    '/admin/post/42/delete',
  ].map((p) => run(p));

  expect(results).toEqual([
    'Welcome Home',
    'Admin',
    'Posts',
    'Post 43',
    'Post 2',
    'Not Found',
    'Admin > Post (id: 42) > Delete',
    'Not Found',
    'Not Found',
    'Admin > Post (id: 42) > Delete',
  ]);
});

describe('namespace', () => {
  const ROUTES = (() => {
    const home = chemin();
    const posts = chemin(home, 'posts');

    const postFragment = chemin('post', pNumber('postId'));

    const post = chemin(home, postFragment);
    const adminHome = chemin(home, 'admin');
    const adminPost = chemin(adminHome, postFragment, pOptional(pConstant('delete')));

    return {
      home,
      posts,
      post,
      adminHome,
      adminPost,
    };
  })();

  test('simple namespace', () => {
    const withNamespace = namespace('base', ROUTES);

    expect(Object.keys(withNamespace)).toEqual(Object.keys(ROUTES));

    expect(withNamespace.home.stringify()).toBe('/base');
    expect(withNamespace.posts.stringify()).toBe('/base/posts');
    expect(withNamespace.adminPost.stringify()).toBe('/base/admin/post/:postId(number)/delete?');
    expect(withNamespace.adminPost.match('/base/admin/post/42/delete')).toEqual({
      exact: true,
      params: { delete: { present: true, value: null }, postId: 42 },
      rest: [],
    });
  });

  test('namespace with param', () => {
    const withNamespace = namespace(pString('base'), ROUTES);

    expect(Object.keys(withNamespace)).toEqual(Object.keys(ROUTES));
    expect(withNamespace.home.stringify()).toBe('/:base');
    expect(withNamespace.posts.stringify()).toBe('/:base/posts');
    expect(withNamespace.adminPost.stringify()).toBe('/:base/admin/post/:postId(number)/delete?');
    expect(withNamespace.adminPost.match('/yolo/admin/post/42/delete')).toEqual({
      exact: true,
      params: { base: 'yolo', delete: { present: true, value: null }, postId: 42 },
      rest: [],
    });
  });

  test('namespace with chemin', () => {
    const withNamespace = namespace(chemin('base', pString('org'), pNumber('orgId')), ROUTES);

    expect(Object.keys(withNamespace)).toEqual(Object.keys(ROUTES));
    expect(withNamespace.home.stringify()).toBe('/base/:org/:orgId(number)');
    expect(withNamespace.posts.stringify()).toBe('/base/:org/:orgId(number)/posts');
    expect(withNamespace.adminPost.stringify()).toBe('/base/:org/:orgId(number)/admin/post/:postId(number)/delete?');

    expect(withNamespace.adminPost.match('/base/yolo/42/admin/post/42/delete')).toEqual({
      exact: true,
      params: { org: 'yolo', orgId: 42, delete: { present: true, value: null }, postId: 42 },
      rest: [],
    });
  });
});

test('prefix', () => {
  const routes = {
    home: chemin(),
    ...prefix('admin', {
      home: chemin('admin'),
      post: chemin('admin', 'post', pNumber('postId')),
    }),
  };
  expect(Object.keys(routes)).toEqual(['home', 'admin.home', 'admin.post']);
});
