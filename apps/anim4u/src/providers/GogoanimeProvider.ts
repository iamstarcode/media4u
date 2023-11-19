import {
  ANIME,
  IAnimeInfo,
  IAnimeResult,
  MediaFormat,
} from '@consumet/extensions';
import _ from 'lodash';

import { BaseProvider, IGetMediType } from './BaseProviderV2.js';
import { homedir } from 'os';
import path from 'path';

import { IProvider } from '../types/index.js';
import { readFileSync } from 'fs';

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

  async getMediaType({
    media,
    type,
  }: IGetMediType): Promise<MediaFormat.MOVIE | MediaFormat.TV> {
    const linksPath = this.getLinksPath({ title: media.title });
    const linksString = readFileSync(linksPath).toString();
    const animeInfo: IAnimeInfo = JSON.parse(linksString);
    if (animeInfo.type?.toLocaleLowerCase().includes('movie')) {
      return MediaFormat.MOVIE;
    } else {
      return MediaFormat.TV;
    }
  }
}
