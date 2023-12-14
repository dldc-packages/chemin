import { expect, test } from 'vitest';
import { Chemin } from '../src/chemin.temp';
import { CheminParam } from '../src/params';

test('Example', () => {
  const workspace = Chemin.create('workspace', CheminParam.string('tenant'));

  const home = Chemin.create('home');
  const workspaceHome = Chemin.create(workspace, 'home');
  const workspaceSettings = Chemin.create(workspace, 'settings');

  const match1 = Chemin.partialMatch(workspaceHome, workspaceHome.match('/workspace/123/home'), workspace);
  // match1 is typed as { tenant: string } | null
  expect(match1).toMatchObject({ tenant: '123' });

  const match2 = Chemin.partialMatch(workspaceSettings, workspaceSettings.match('/workspace/123/settings'), workspace);
  expect(match2).toMatchObject({ tenant: '123' });

  const match3 = Chemin.partialMatch(home, home.match('/home'), workspace);
  expect(match3).toBe(null);
});

test('partial match', () => {
  const userPart = Chemin.create('user', CheminParam.string('id'));

  const route1 = Chemin.create('admin', CheminParam.string('id'), userPart, 'demo');
  const route2 = Chemin.create(userPart, 'demo', CheminParam.string('action'));
  const route3 = Chemin.create('admin', CheminParam.string('id'), 'user', CheminParam.string('id'));

  const route1Match = route1.match('/admin/123/user/456/demo');
  const route2Match = route2.match('/user/123/demo/edit');
  const route3Match = route3.match('/admin/123/user/456');
  const route3Match2 = route3.match('/yolo');

  expect(Chemin.partialMatch(route1, route1Match, userPart)).toMatchObject({ id: '456' });
  expect(Chemin.partialMatch(route2, route2Match, userPart)).toMatchObject({ id: '123' });
  expect(Chemin.partialMatch(route3, route3Match, userPart)).toBe(null);
  expect(Chemin.partialMatch(route3, route3Match2, userPart)).toBe(null);
});
