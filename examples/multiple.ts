import { Chemin, CheminParams } from '../dist';

const chemin1 = Chemin.create(CheminParams.multiple(CheminParams.string('categories')));
console.log(Chemin.matchExact(chemin1, '/')); // { categories: [] }
console.log(Chemin.matchExact(chemin1, '/foo/bar')); // { categories: ['foo', 'bar'] }

const chemin2 = Chemin.create(CheminParams.multiple(CheminParams.string('categories'), true));
console.log(Chemin.matchExact(chemin2, '/')); // false because atLeastOne is true
console.log(Chemin.matchExact(chemin2, '/foo/bar')); // { categories: ['foo', 'bar'] }
