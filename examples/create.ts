import { Chemin, CheminParams as P } from '../dist';

const path = Chemin.create('admin', 'post', P.number('postId'), P.optionalConst('delete'));

console.log(Chemin.match(path, '/no/valid'));
// => false

const match = Chemin.match(path, '/admin/post/45');
console.log(match);
// => { rest: [], params: { postId: 'e5t89u', delete: false } }

// match has the correct type
console.log(match && match.params.postId); // postId is a number
console.log(match && match.params.delete); // postId is a boolean
