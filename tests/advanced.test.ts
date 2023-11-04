import { expect, test } from 'vitest';
import { Chemin, CheminParam as P } from '../src/mod';

test('advanced', () => {
  const ROUTES = (() => {
    const home = Chemin.create();
    const posts = Chemin.create(home, 'posts');

    const postFragment = Chemin.create('post', P.number('postId'));

    const post = Chemin.create(home, postFragment);
    const admin = Chemin.create(home, 'admin');
    const adminPost = Chemin.create(admin, postFragment, P.optional(P.constant('delete')));

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
    const routes = Chemin.matchAllNested(ROUTES, pathname);
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
