import { Chemin, CheminParam } from '../src';

const chemin = Chemin.create(CheminParam.optional(CheminParam.integer('myInt')));
console.log(chemin.matchExact('/42')); // { myInt: { present: true, value: 42 } }
console.log(chemin.matchExact('/')); // { myInt: { present: false } }
