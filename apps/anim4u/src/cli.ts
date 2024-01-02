#!/usr/bin/env node
import { Command } from 'commander';
import { CLI, IO } from '@iamstarcode/4u-lib';

import fs from 'fs';
import path from 'path';

const { __dirname } = IO.fileDirName(import.meta);
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
const packagejson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

(async () => {
  const program = new Command();
  const version = packagejson.version;

  await CLI.handleIfNewVersion(version!, 'anim4u');

  program
    .name('cli')
    .version(version!)
    .command('download', 'Download a TV series or Movie')
    .command('clear', 'Clear cache');
  program.parseAsync(process.argv);
})();
