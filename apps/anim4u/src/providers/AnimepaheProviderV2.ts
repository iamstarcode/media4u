import { homedir } from 'os';
import path from 'path';
import { ANIME } from '@consumet/extensions';
import _ from 'lodash';

import { BaseProvider } from './BaseProviderV2.js';
import { IProvider } from '../types/index.js';

export class AnimepaheProvider extends BaseProvider {
  constructor({ options, query }: IProvider) {
    super({
      options,
      query,
      provider: new ANIME.AnimePahe(),
      searchPath: path.join(homedir(), 'anim4u', 'animepahe2', 'Searches'),
      _provider: 'animepahe2',
    });
  }
}
