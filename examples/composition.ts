import { Chemin, CheminParam as P } from '../src';

const postFragment = Chemin.create('post', P.number('postId'));
const postAdmin = Chemin.create('admin', P.string('userId'), postFragment, 'edit');

console.log(postAdmin.stringify()); // /admin/:userId/post/:postId(number)/edit
