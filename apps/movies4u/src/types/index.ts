import FlixHQ from '@consumet/extensions-x/dist/providers/movies/flixhq';
import MovieHdWatch from '@consumet/extensions-x/dist/providers/movies/movidhdwatch';

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
  selectedEpisodes: any[];
  debug?: boolean;
  force?: boolean;
  executablePath: string;
  quality: number;
};

export type Provider = FlixHQ['name'] | MovieHdWatch['name'];
export type ISupportedProvider = FlixHQ | MovieHdWatch;
export interface IBaseProvider {
  options: OptionsType;
  query: string;
  provider: ISupportedProvider;
  searchPath: string;
  _provider: Provider;
}

export interface IProvider {
  options: OptionsType;
  query: string;
  provider: string;
}
