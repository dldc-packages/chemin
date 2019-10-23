import { Chemin, CheminParam } from '../src';

const chemin1 = Chemin.create(CheminParam.multiple(CheminParam.string('categories')));
console.log(chemin1.matchExact('/')); // { categories: [] }
console.log(chemin1.matchExact('/foo/bar')); // { categories: ['foo', 'bar'] }

const chemin2 = Chemin.create(CheminParam.multiple(CheminParam.string('categories'), true));
console.log(chemin2.matchExact('/')); // false because atLeastOne is true
console.log(chemin2.matchExact('/foo/bar')); // { categories: ['foo', 'bar'] }
