import { MOVIES } from '@consumet/extensions';
import _ from 'lodash';

import { BaseProvider } from './BaseProvider.js';
import { homedir } from 'os';
import path from 'path';

import { IBaseProvider, IProvider } from '../types/index.js';

export default class FlixHQProvider extends BaseProvider {
  constructor({
    options,
    query,
  }: Omit<IBaseProvider, 'provider' | 'searchPath' | 'providerName'>) {
    super({
      options,
      query,
      provider: new MOVIES.FlixHQ(),
      searchPath: path.join(homedir(), 'movie4u', 'FlixHQ', 'Searches'),
      providerName: 'flixhq',
    });
  }
}
