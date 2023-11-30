#!/usr/bin/env node
import { Command } from 'commander';
import { CLI } from '@iamstarcode/4u-lib';

(async () => {
  const program = new Command();
  const version = '0.0.9';

  CLI.handleIfNewVersion(version, 'anim4u');

  program
    .name('cli')
    .version(version)
    .command('download', 'Download a TV series or Movie')
    .command('clear', 'Clear cache');
  program.parseAsync(process.argv);
})();
