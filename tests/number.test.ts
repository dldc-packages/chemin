import { expect, test } from 'vitest';
import { Chemin, CheminParam } from '../src/mod';

test('number', () => {
  const chemin = Chemin.create(CheminParam.number('myNum'));
  expect(chemin.matchExact('/3.1415')).toEqual({ myNum: 3.1415 });
});
