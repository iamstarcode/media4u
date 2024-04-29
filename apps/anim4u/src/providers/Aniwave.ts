import {
  ANIME,
  IAnimeEpisode,
  IAnimeInfo,
  IAnimeResult,
  MediaFormat,
  MediaStatus,
} from '@consumet/extensions';
import _ from 'lodash';

import { BaseProvider } from './BaseProvider.js';
import { homedir } from 'os';
import path from 'path';

import { IBaseProvider } from './BaseProviderX.js';
import { load } from 'cheerio';

export class Aniwave extends BaseProvider {
  baseUrl = 'https://aniwave.to';
  constructor({ options, query }: IBaseProvider) {
    // baseUrl = 'https://aniwave.to';
    super({
      options,
      query,
      provider: new ANIME.NineAnime(),
      searchPath: path.join(homedir(), 'anim4u', 'gogoanime', 'Searches'),
      providerName: 'aniwave',
    });
  }
}
