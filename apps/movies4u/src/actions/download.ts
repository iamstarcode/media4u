#!/usr/bin/env node
import { OptionsType, Provider } from '../types/index.js';

import { FlixHQProvider } from '../providers/FlixHQProvider.js';
import chalk from 'chalk';
import { checkFormat, handleEpisodes } from '../utils/cli.js';
import { MovieHdWatchProvider } from '../providers/MovieHdWatchProvider.js';

const downloadAction = async (_query: Provider[], options: OptionsType) => {
  const streamedEpisodes = handleEpisodes(options.selectedEpisodes);
  options.selectedEpisodes = streamedEpisodes;

  const query = _query[1];
  const provider: Provider = _query[0];

  const obj = { options, query, provider };

  if (options.debug) {
    console.log('args', _query, options);
  }

  if (provider == 'FlixHQ'.toLocaleLowerCase()) {
    const provider = new FlixHQProvider(obj);
    await provider.run();
  } else if (provider == 'MovieHdWatch'.toLocaleLowerCase()) {
    const provider = new MovieHdWatchProvider(obj);
    await provider.run();
  } else {
    console.log(chalk.red('Provider not found'));
    process.exit(0);
  }
};

export default downloadAction;
