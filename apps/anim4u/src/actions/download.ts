#!/usr/bin/env node
import { OptionsType, Provider } from '../types/index.js';
import { AnimepaheProvider as AnimepaheProvider2 } from '../providers/AnimepaheProvider.js';
import { GogoanimeProvider } from '../providers/GogoanimeProvider.js';
import { AnimepaheProvider } from '../providers/AnimepaheProvider2.js';

const downloadAction = async (_query: Provider[], options: OptionsType) => {
  const query = _query[1];
  const provider = _query[0];

  const obj = { options, query, provider };

  if (options.debug) {
    console.log('args', _query, options);
  }

  if (provider == 'animepahe') {
    const provider = new AnimepaheProvider(obj);
    await provider.run();
  } else if (provider == 'animepahe2') {
    const provider = new AnimepaheProvider2(obj);
    await provider.run();
  } else if (provider == 'gogoanime') {
    const provider = new GogoanimeProvider(obj);
    await provider.run();
  } else {
    console.log('Provider not found');
    process.exit(0);
  }
};

export default downloadAction;
