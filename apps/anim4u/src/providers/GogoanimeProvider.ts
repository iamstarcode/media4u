import { ANIME } from '@consumet/extensions';
import _ from 'lodash';

import { BaseProvider } from './BaseProviderV2.js';
import { homedir } from 'os';
import path from 'path';

import { IProvider } from '../types/index.js';

export class GogoanimeProvider extends BaseProvider {
  constructor({ options, query }: IProvider) {
    super({
      options,
      query,
      provider: new ANIME.Gogoanime(),
      searchPath: path.join(homedir(), 'anim4u', 'gogoanime', 'Searches'),
      _provider: 'gogoanime',
    });
  }
}
