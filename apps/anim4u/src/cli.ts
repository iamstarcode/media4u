#!/usr/bin/env node
import axios from 'axios';
import chalk from 'chalk';
import { Command } from 'commander';

(async () => {
  const program = new Command();
  const version = '0.1.5';
  const response = await axios.get(`https://registry.npmjs.org/anim4u`);
  const latestVersion = response.data['dist-tags'].latest;

  if (latestVersion != version) {
    console.log('New version available: ', chalk.green(latestVersion));
    console.log('Version installed: ', chalk.red(version));
  }

  program
    .name('cli')
    .version(version)
    .command('download', 'Download a TV series or Movie')
    .command('clear', 'Clear cache');
  program.parseAsync(process.argv);
})();
