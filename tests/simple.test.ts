import { Chemin } from '../src';

test('simple', () => {
  const chemin = Chemin.parse('/admin/post/:postId/delete?');

  expect(chemin.match('/no/valid')).toBe(false);
  expect(chemin.match('/admin/post/e5t89u')).toEqual({ rest: [], params: { postId: 'e5t89u', delete: false } });
});
