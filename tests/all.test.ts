import { expect, test } from 'vitest';
import { Chemin } from '../src/Chemin';
import { CheminParam } from '../src/CheminParam';
import { splitPathname } from '../src/utils';

test('matchAll', () => {
  const ROUTES = {
    home: Chemin.create(),
    login: Chemin.create('login'),
    workspace: Chemin.create('workspace', CheminParam.string('workspaceId')),
    workspaceSettings: Chemin.create('workspace', CheminParam.string('workspaceId'), 'settings'),
  };

  expect(Chemin.matchAll(ROUTES, splitPathname('/workspace/123'))).toEqual({
    home: {
      exact: false,
      params: {},
      rest: ['workspace', '123'],
    },
    login: false,
    workspace: {
      exact: true,
      params: {
        workspaceId: '123',
      },
      rest: [],
    },
    workspaceSettings: false,
  });
});
