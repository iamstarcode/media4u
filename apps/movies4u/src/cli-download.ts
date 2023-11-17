#!/usr/bin/env node
import { Command } from 'commander';
import downloadAction from './actions/download.js';
import {
  providerSeperated,
  pasrseResolution,
  collect,
} from './helpers/cliParsers.js';

const program = new Command();
function main() {
  program
    .argument(
      '<provider:anime>',
      'The provider and name of the anime seprated by :',
      providerSeperated
    )
    .option('-d, --debug', 'Debugging', false)
    .option('-f, --force', 'Force refecth', false)
    .option('-q, --quality <number>', 'Quality', pasrseResolution)
    .option('-e, --selectedEpisodes <episodes>', 'Episode', collect, [])
    .action(downloadAction);
  program.parseAsync(process.argv);
}
main();
//# sourceMappingURL=cli-download.js.map//
