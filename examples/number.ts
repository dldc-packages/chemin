import { Chemin, CheminParams } from '../dist';

const chemin = Chemin.create(CheminParams.number('myNum'));
console.log(Chemin.matchExact(chemin, '/3.1415')); // { myNum: 3.1415 }
