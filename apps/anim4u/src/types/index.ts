import Gogoanime from '@consumet/extensions/dist/providers/anime/gogoanime.js';
import AnimeSaturn from '@consumet/extensions/dist/providers/anime/animesaturn';
import AnimePahe from '@consumet/extensions/dist/providers/anime/animepahe.js';

export interface IMedia {
  name?: string;
  title?: string;
  link?: string;
  id?: string;
  type?: string;
  year?: string;
  session?: string;
  episodes?: string;
}

export interface ILink {
  title: string;
  type: string;
  links: [];
}

export interface ISeriesMedia extends IMedia {
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

export type Provider = 'animepahe' | 'animepahe2' | 'gogoanime';
export type ISupportedProvider = Gogoanime | AnimePahe;
export interface IBaseProvider {
  options: OptionsType;
  query: string;
  provider: ISupportedProvider;
  searchPath: string;
  _provider: string;
}

export interface IProvider {
  options: OptionsType;
  query: string;
  provider: string;
}
