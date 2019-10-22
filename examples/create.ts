import { Chemin, CheminParams as P } from '../dist';

const path = Chemin.create('admin', 'post', P.number('postId'), P.optionalConst('delete'));

console.log(Chemin.match(path, '/no/valid'));
// => false

const match = Chemin.match(path, '/admin/post/45');
console.log(match);
// => { rest: [], params: { postId: 45, delete: false } }
