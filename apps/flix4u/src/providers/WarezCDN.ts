import _ from 'lodash';

import path from 'path';

import { IBaseProvider } from '../types/index.js';
import { BaseMovieWebProvider } from './BaseMovieWebProvider.js';
import {
  Fetcher,
  makeProviders,
  makeStandardFetcher,
  targets,
} from '@movie-web/providers';
import { appPath } from '../config/constants.js';

//import fetch from 'node-fetch';
interface StreamInfo {
  resolution: string;
  url: string;
}

export default class WarezCDN extends BaseMovieWebProvider {
  constructor({
    options,
    query,
  }: Omit<IBaseProvider, 'searchPath' | 'provider' | 'providerName'>) {
    super({
      options,
      query,
      searchPath: path.join(appPath, 'Searches'),
      providerName: 'warezcdn',
    });
  }
}
