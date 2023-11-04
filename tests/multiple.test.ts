import { expect, test } from 'vitest';
import { Chemin, CheminParam } from '../src/mod';

test('multiple allow zero', () => {
  const chemin = Chemin.create(CheminParam.multiple(CheminParam.string('categories')));
  expect(chemin.matchExact('/')).toEqual({ categories: [] });
  expect(chemin.matchExact('/foo/bar')).toEqual({ categories: ['foo', 'bar'] });
});

test('multiple atLeastOne', () => {
  const chemin = Chemin.create(CheminParam.multiple(CheminParam.string('categories'), true));
  expect(chemin.matchExact('/')).toBe(null);
  expect(chemin.matchExact('/foo/bar')).toEqual({ categories: ['foo', 'bar'] });
});
