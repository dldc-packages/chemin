import { Chemin, CheminParam } from '../src';

const chemin = Chemin.create(CheminParam.number('myNum'));
console.log(chemin.matchExact('/3.1415')); // { myNum: 3.1415 }
