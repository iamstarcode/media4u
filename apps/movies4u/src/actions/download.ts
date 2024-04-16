#!/usr/bin/env node
import { OptionsType, Provider } from '../types/index.js';

import { FlixHQProvider } from '../providers/FlixHQProvider.js';
import chalk from 'chalk';
import { MovieHdWatchProvider } from '../providers/MovieHdWatchProvider.js';

import { CLI } from '@iamstarcode/4u-lib';
import { VidSrcToProvider } from '../providers/VidSrcToProvider.js';

const downloadAction = async (_query: Provider[], options: OptionsType) => {
  const streamedEpisodes = CLI.handleEpisodes(options.selectedEpisodes);

  options.selectedEpisodes = streamedEpisodes;

  const query = _query[1];
  const provider = _query[0];

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
  } else if (provider.toLocaleLowerCase() == 'vidsrcto') {
    const vidSrcToprovider = new VidSrcToProvider({
      options,
      providerName: 'vidsrcto',
      query,
    });
    await vidSrcToprovider.run();
  } else {
    console.log(chalk.red('Provider not found'));
    process.exit(0);
  }
};

export default downloadAction;
