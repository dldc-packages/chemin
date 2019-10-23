import { Chemin } from '../src';

const chemin = Chemin.parse('/admin/post/:postId/delete?');

console.log(chemin.match('/no/valid'));
// => false

console.log(chemin.match('/admin/post/e5t89u'));
// => { rest: [], params: { postId: 'e5t89u', delete: false } }
