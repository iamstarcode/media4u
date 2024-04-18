#!/usr/bin/env node
import { Command } from 'commander';
import downloadAction from './actions/download.js';

import { CLI } from '@iamstarcode/4u-lib';
const program = new Command();
function main() {
  program
    .argument(
      '<provider:anime>',
      'The provider and name of the anime seprated by :',
      CLI.providerSeperated
    )
    .option('-d, --debug', 'Debugging', false)
    .option('-f, --force', 'Force refecth', false)
    .option('-q, --quality <number>', 'Quality', CLI.pasrseResolution)
    .option('-s, --subtitle <string>', 'Subtitle', CLI.pasrseResolution)
    .option('-e, --episodes <episodes>', 'Episode', CLI.collect, [])
    .action(downloadAction);
  program.parseAsync(process.argv);
}
main();
