#!/usr/bin/env node
import { IBaseProvider, OptionsType, Provider } from '../types/index.js';

import { FlixHQProvider } from '../providers/FlixHQProvider.js';
import chalk from 'chalk';
import { MovieHdWatchProvider } from '../providers/MovieHdWatchProvider.js';

import { CLI } from '@iamstarcode/4u-lib';
import { VidSrcToProvider } from '../providers/VidSrcToProvider.js';
import _ from 'lodash';

type Providers = Pick<IBaseProvider, 'providerName'>;
const downloadAction = async (
  _query: [IBaseProvider['providerName'], string],
  options: OptionsType
) => {
  const streamedEpisodes = CLI.handleEpisodes(options.episodes);

  options.episodes = streamedEpisodes;

  const [providerName, query] = _query;

  const obj = { options, query };

  if (options.debug) {
    console.log('args', _query, options);
  }

  if (providerName == 'flixhq') {
    const provider = new FlixHQProvider(obj);
    await provider.run();
  } else if (providerName == 'moviehdwatch') {
    const provider = new MovieHdWatchProvider(obj);
    await provider.run();
  } else if (providerName == 'vidsrcto') {
    const vidSrcToprovider = new VidSrcToProvider(obj);
    await vidSrcToprovider.run();
  } else {
    console.log(chalk.red('Provider not found'));
    process.exit(0);
  }
};

export default downloadAction;
