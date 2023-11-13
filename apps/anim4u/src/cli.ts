#!/usr/bin/env node
import { Command } from 'commander';
import { handleIfNewVersion } from '@iamstarcode/4u-helper';

(async () => {
  const program = new Command();
  const version = '0.1.5';

  handleIfNewVersion(version, 'anim4u');

  program
    .name('cli')
    .version(version)
    .command('download', 'Download a TV series or Movie')
    .command('clear', 'Clear cache');
  program.parseAsync(process.argv);
})();
