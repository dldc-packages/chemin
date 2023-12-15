import { expect, test } from 'vitest';
import { chemin, pNumber, pString } from '../src/mod';

test('composition', () => {
  const postFragment = chemin('post', pNumber('postId'));
  const postAdmin = chemin('admin', pString('userId'), postFragment, 'edit');

  expect(postAdmin.stringify()).toBe('/admin/:userId/post/:postId(number)/edit');
});
