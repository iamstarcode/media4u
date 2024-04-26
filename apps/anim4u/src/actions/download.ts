#!/usr/bin/env node
import { OptionsType, Provider } from '../types/index.js';
import { AnimepaheProvider } from '../providers/AnimepaheProvider.js';
import { GogoanimeProvider } from '../providers/GogoanimeProvider.js';
import { AnimepaheProvider as AnimepaheProvider2 } from '../providers/AnimepaheProvider2.js';
import { CLI } from '@iamstarcode/4u-lib';
import { Aniwave } from '../providers/Aniwave.js';

const downloadAction = async (_query: Provider[], options: OptionsType) => {
  const [providerName, query] = _query;

  const obj = { options, query, providerName };

  if (options.debug) {
    console.log('args', _query, options);
  }

  if (providerName == 'aniwave') {
    const provider = new Aniwave(obj);
    await provider.run();
  } else if (providerName == 'animepahe2') {
    const provider = new AnimepaheProvider2(obj);
    await provider.run();
  } else if (providerName == 'gogoanime') {
    const provider = new GogoanimeProvider(obj);
    await provider.run();
  } else {
    CLI.printInfo('Provider not found');
    process.exit(0);
  }
};

export default downloadAction;
//
