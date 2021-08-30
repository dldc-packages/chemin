import { Chemin, CheminParam as P } from '../src/mod';

test('create', () => {
  const chemin = Chemin.create('admin', 'post', P.number('postId'), P.optionalConst('delete'));

  expect(chemin.match('/no/valid')).toBe(false);
  expect(chemin.match('/admin/post/45')).toEqual({
    rest: [],
    params: { postId: 45, delete: false },
  });
});
