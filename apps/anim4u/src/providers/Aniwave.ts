import { ANIME } from '@consumet/extensions';
import _ from 'lodash';

import { BaseProvider } from './BaseProvider.js';
import { homedir } from 'os';
import path from 'path';

import { IBaseProvider } from './BaseProviderX.js';

export class Aniwave extends BaseProvider {
  constructor({ options, query }: IBaseProvider) {
    super({
      options,
      query,
      provider: new ANIME.NineAnime(),
      searchPath: path.join(homedir(), 'anim4u', 'gogoanime', 'Searches'),
      providerName: 'aniwave',
    });
  }
}
