#!/usr/bin/env node
import { IBaseProvider, OptionsType, Provider } from '../types/index.js';

import FlixHQ from '../providers/FlixHQ.js';
import chalk from 'chalk';
import { MovieHdWatchProvider } from '../providers/MovieHdWatchProvider.js';

import { CLI } from '@iamstarcode/4u-lib';
import VidSrcTo from '../providers/VidSrcTo.js';
import _ from 'lodash';
import HDRezka from '../providers/HDRezka.js';
import WarezCDN from '../providers/WarezCDN.js';

type Providers = Pick<IBaseProvider, 'providerName'>;
const downloadAction = async (
  _query: [IBaseProvider['providerName'], string],
  options: OptionsType
) => {
  const streamedEpisodes = CLI.parseSeasonalEpisodes(options.episodes);
  options.episodes = streamedEpisodes;

  const [providerName, query] = _query;

  const obj = { options, query };

  if (options.debug) {
    console.log('args', _query, options);
  }

  if (providerName == 'flixhq') {
    const provider = new FlixHQ(obj);
    await provider.run();
  } else if (providerName == 'moviehdwatch') {
    const provider = new MovieHdWatchProvider(obj);
    await provider.run();
  } else if (providerName == 'vidsrcto') {
    const vidSrcToprovider = new VidSrcTo(obj);
    await vidSrcToprovider.run();
  } else if (providerName == 'hdrezka') {
    const hdrezka = new HDRezka(obj);
    await hdrezka.run();
  } else if (providerName == 'warezcdn') {
    const warezcdn = new WarezCDN(obj);
    await warezcdn.run();
  } else {
    console.log(chalk.red('Provider not found'));
    process.exit(0);
  }
};

export default downloadAction;
