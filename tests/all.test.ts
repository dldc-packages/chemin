import { expect, test } from 'vitest';
import { chemin, matchAll, pString, splitPathname } from '../src/mod';

test('Example', () => {
  const chemins = {
    home: chemin('home'),
    workspace: chemin('workspace', pString('tenant')),
    workspaceSettings: chemin('workspace', pString('tenant'), 'settings'),
  };

  const match = matchAll(chemins, '/workspace/123/settings');
  expect(match).toEqual({
    home: null,
    workspace: { rest: ['settings'], exact: false, params: { tenant: '123' } },
    workspaceSettings: { rest: [], exact: true, params: { tenant: '123' } },
  });
});

test('matchAll', () => {
  const ROUTES = {
    home: chemin(),
    login: chemin('login'),
    workspace: chemin('workspace', pString('workspaceId')),
    workspaceSettings: chemin('workspace', pString('workspaceId'), 'settings'),
  };

  expect(matchAll(ROUTES, splitPathname('/workspace/123'))).toEqual({
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
