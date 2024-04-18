#!/usr/bin/env node
import fs from 'fs';
import { Command } from 'commander';
import { appPath } from './config/constants.js';
import chalk from 'chalk';
import path from 'path';

const program = new Command();

function handleClear(path: string, arg: string) {
  if (fs.existsSync(path)) {
    fs.rmSync(path, { recursive: true, force: true });
    console.log(chalk.green(`Cleared ${arg} cache \u2713`));
  } else {
    console.log(
      chalk.yellow(`No ${arg !== 'all' ? arg : 'provider(s)'} cache to clear`)
    );
  }

  process.exit(0);
}
function main() {
  program
    .argument(
      '<provider>',
      '<provider|all> The provider cache to clear, or all'
    )
    .action((arg) => {
      switch (arg) {
        case 'all':
          handleClear(appPath, arg);
          break;
        case 'animepahe':
          handleClear(path.join(appPath, 'animepahe'), arg);
          break;
        case 'gogoanime':
          handleClear(path.join(appPath, 'gogoanime'), arg);
          break;
        default:
          console.log(chalk.red(`Provider not avialable`));
      }
    });

  program.parse(process.argv);
}

main();
