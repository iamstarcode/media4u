import { MOVIES } from '@consumet/extensions';
import _ from 'lodash';

import { BaseProvider } from './BaseProvider.js';
import { homedir } from 'os';
import path from 'path';

import { IBaseProvider, IProvider } from '../types/index.js';

export class MovieHdWatchProvider extends BaseProvider {
  constructor({
    options,
    query,
  }: Omit<IBaseProvider, 'provider' | 'searchPath' | 'providerName'>) {
    super({
      options,
      query,
      provider: new MOVIES.MovieHdWatch(),
      searchPath: path.join(homedir(), 'movie4u', 'MovieHdWatch', 'Searches'),
      providerName: 'moviehdwatch',
    });
  }
}
