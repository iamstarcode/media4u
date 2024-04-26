import Gogoanime from '@consumet/extensions/dist/providers/anime/gogoanime.js';
import AnimePahe from '@consumet/extensions/dist/providers/anime/animepahe.js';
import { AnimeParser, BaseParser } from '@consumet/extensions/dist/models';

export interface IAnimeResult {
  name?: string;
  title?: string;
  link?: string;
  id?: string;
  type?: string;
  session?: string;
  episodes?: string;
  [x: string]: any;
}

export interface ILink {
  title: string;
  type: string;
  links: [];
}

export interface ISeriesMedia extends IAnimeResult {
  seasons: [
    {
      season: string;
      number: number;
      episodes: [
        {
          episode: number;
          title: string;
          episodeTitle: string;
          episodeLink: string;
        }
      ];
    }
  ];
}

export type Seasons = Pick<ISeriesMedia, 'seasons'>;

export type OptionsType = {
  episodes: [];
  debug?: boolean;
  force?: boolean;
  executablePath: string;
  quality: number;
};

export type Provider = 'animepahe' | 'animepahe2' | 'gogoanime' | 'aniwave';
export type ISupportedProvider = Gogoanime | AnimePahe;
export interface IBaseProvider {
  options: OptionsType;
  query: string;
  provider: AnimeParser;
  searchPath: string;
  providerName: string;
}
