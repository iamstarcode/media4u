import { MOVIES } from '@consumet/extensions';
import _ from 'lodash';

import { BaseProvider } from './BaseProvider.js';
import { homedir } from 'os';
import path from 'path';

import {
  IBaseProvider,
  IProvider,
  MovieWebBaseProviderType,
} from '../types/index.js';
import { BaseMovieWebProvider } from './BaseMovieWebProvider.js';

export class VidSrcToProvider extends BaseMovieWebProvider {
  constructor({
    options,
    query,
    providerName,
  }: Omit<IBaseProvider, 'searchPath' | 'provider'>) {
    super({
      options,
      providerName,
      query,
      searchPath: path.join(homedir(), 'movie4u', 'VidSrcTo', 'Searches'),
    });
  }
}
