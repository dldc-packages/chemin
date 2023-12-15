import { expect, test } from 'vitest';
import { chemin, pInteger, pOptional } from '../src/mod';

test('optional', () => {
  const c = chemin(pOptional(pInteger('myInt')));
  expect(c.matchExact('/42')).toEqual({ myInt: { present: true, value: 42 } });
  expect(c.matchExact('/')).toEqual({ myInt: { present: false } });
});
