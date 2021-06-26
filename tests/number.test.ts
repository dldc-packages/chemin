import { Chemin, CheminParam } from '../src';

test('number', () => {
  const chemin = Chemin.create(CheminParam.number('myNum'));
  expect(chemin.matchExact('/3.1415')).toEqual({ myNum: 3.1415 });
});
