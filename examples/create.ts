import { Chemin, CheminParam as P } from '../src';

const chemin = Chemin.create('admin', 'post', P.number('postId'), P.optionalConst('delete'));

console.log(chemin.match('/no/valid'));
// => false

const match = chemin.match('/admin/post/45');
console.log(match);
// => { rest: [], params: { postId: 45, delete: false } }
