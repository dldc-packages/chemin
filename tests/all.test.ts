import { expect, test } from 'vitest';
import { Chemin } from '../src/chemin.temp';
import { CheminParam } from '../src/params';
import { splitPathname } from '../src/utils';

test('Example', () => {
  const chemins = {
    home: Chemin.create('home'),
    workspace: Chemin.create('workspace', CheminParam.string('tenant')),
    workspaceSettings: Chemin.create('workspace', CheminParam.string('tenant'), 'settings'),
  };

  const match = Chemin.matchAll(chemins, '/workspace/123/settings');
  expect(match).toEqual({
    home: null,
    workspace: { rest: ['settings'], exact: false, params: { tenant: '123' } },
    workspaceSettings: { rest: [], exact: true, params: { tenant: '123' } },
  });
});

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
    login: null,
    workspace: {
      exact: true,
      params: {
        workspaceId: '123',
      },
      rest: [],
    },
    workspaceSettings: null,
  });
});
