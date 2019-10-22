import { Chemin, CheminParams } from '../dist';

const chemin = Chemin.create(CheminParams.optional(CheminParams.interger('myInt')));
console.log(Chemin.matchExact(chemin, '/42')); // { myInt: { present: true, value: 42 } }
console.log(Chemin.matchExact(chemin, '/')); // { myInt: { present: false } }
