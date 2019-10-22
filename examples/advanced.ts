import { Chemin, CheminParams as P } from '../dist';

function matchExact<Params>(chemin: Chemin<Params>, pathname: string): Params | false {
  const match = Chemin.match(chemin, pathname);
  if (match !== false && match.rest.length === 0) {
    return match.params;
  }
  return false;
}

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

type MatchAllResult<T> = T extends Chemin<infer P>
  ? (P | false)
  : {
      [K in keyof T]: MatchAllResult<T[K]>;
    };

function matchAll<T>(obj: T, pathname: string): MatchAllResult<T> {
  if (Chemin.is(obj)) {
    return matchExact(obj, pathname);
  }
  return Object.keys(obj).reduce<any>((acc, key) => {
    acc[key] = matchAll((obj as any)[key], pathname);
    return acc;
  }, {});
}

function run(pathname: string) {
  const adminPostMatch = matchExact(ROUTES.admin.post, pathname);
  if (adminPostMatch) {
    return `Admin > Post (id: ${adminPostMatch.postId})${adminPostMatch.delete ? ' > Delete' : ''}`;
  }
  const routes = matchAll(ROUTES, pathname);
  if (routes.home) {
    return `Welcome Home`;
  }
  if (routes.post) {
    return `Post ${routes.post.postId}`;
  }
  if (routes.posts) {
    return `Posts`;
  }
  if (routes.admin.home) {
    return `Admin`;
  }
  return `Not Found`;
}

[
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
].map(p => {
  console.log(`${p} ==> ${run(p)}`);
});