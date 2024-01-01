#!/usr/bin/env node
import { Command } from 'commander';
import { CLI } from '@iamstarcode/4u-lib';

import fs from 'fs';
const packagejson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

(async () => {
  const program = new Command();
  const version = packagejson.version;
  //console.log(packagejson.version);

  await CLI.handleIfNewVersion(version!, 'anim4u');

  program
    .name('cli')
    .version(version!)
    .command('download', 'Download a TV series or Movie')
    .command('clear', 'Clear cache');
  program.parseAsync(process.argv);
})();
