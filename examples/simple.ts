import { Chemin } from '../dist';

const path = Chemin.parse('/admin/post/:postId/delete?');

console.log(Chemin.match(path, '/no/valid'));
// => false

console.log(Chemin.match(path, '/admin/post/e5t89u'));
// => { rest: [], params: { postId: 'e5t89u', delete: false } }
