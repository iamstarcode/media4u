import { homedir } from 'node:os';
import path from 'node:path';

import { BaseProvider } from './BaseProvider.js';

import _ from 'lodash';

import { ANIME } from '@consumet/extensions';
import { IBaseProvider } from './BaseProviderX.js';

interface IEpisode {
  id: string;
  episode: string;
  session: string;
}

interface ILinks {
  title: string;
  type: string;
  links: [{ episode: string; session: string }];
}

export class AnimepaheProvider extends BaseProvider {
  constructor({ options, query }: IBaseProvider) {
    super({
      options,
      query,
      provider: new ANIME.AnimePahe(),
      searchPath: path.join(homedir(), 'anim4u', 'animepahe', 'Searches'),
      providerName: 'animepahe',
    });
  }
}
