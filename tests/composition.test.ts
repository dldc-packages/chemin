import { Chemin, CheminParam as P } from '../src';

test('composition', () => {
  const postFragment = Chemin.create('post', P.number('postId'));
  const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');

  expect(postAdmin.stringify()).toBe('/admin/:userId/post/:postId(number)/edit');
});
