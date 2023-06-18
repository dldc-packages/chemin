import { expect, test } from 'vitest';
import { Chemin, CheminParam } from '../src/mod';

test('optional', () => {
  const chemin = Chemin.create(CheminParam.optional(CheminParam.integer('myInt')));
  expect(chemin.matchExact('/42')).toEqual({ myInt: { present: true, value: 42 } });
  expect(chemin.matchExact('/')).toEqual({ myInt: { present: false } });
});
