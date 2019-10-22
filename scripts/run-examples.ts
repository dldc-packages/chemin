import * as fse from 'fs-extra';
import * as path from 'path';
import inquirer from 'inquirer';
import { spawn } from 'child_process';

console.log(inquirer);

(async () => {
  const dir = await fse.readdir(path.resolve(__dirname, '../examples'));
  const res = await inquirer.prompt({
    type: 'list',
    name: 'file',
    message: 'Which example do you want to run ?',
    choices: dir,
  });

  const file = path.resolve(__dirname, '../examples', res.file);
  console.log(`Running examples/${res.file}...\n`);
  spawn(path.resolve(__dirname, '../node_modules/.bin/ts-node'), [file], { stdio: 'inherit' });
})();
