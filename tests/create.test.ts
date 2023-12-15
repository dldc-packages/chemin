import { expect, test } from 'vitest';
import { chemin, pNumber, pOptionalConst } from '../src/mod';

test('create', () => {
  const c = chemin('admin', 'post', pNumber('postId'), pOptionalConst('delete'));

  expect(c.match('/no/valid')).toBe(null);
  expect(c.match('/admin/post/45')).toEqual({
    rest: [],
    params: { postId: 45, delete: false },
    exact: true,
  });
});
