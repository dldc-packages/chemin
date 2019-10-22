import { Chemin, CheminParams as P } from '../dist';

const postFragment = Chemin.create('post', P.number('postId'));
const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');

console.log(Chemin.stringify(postAdmin)); // /admin/:userId/post/:postId(number)/edit
