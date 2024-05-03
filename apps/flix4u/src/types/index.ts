import FlixHQ from '@consumet/extensions/dist/providers/movies/flixhq';
import { BaseParser } from '@consumet/extensions/dist/models';
import MovieHdWatch from '@consumet/extensions/dist/providers/movies/movidhdwatch';
import { SourcererOutput, Stream } from '@movie-web/providers';

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
  episodes: any[];
  debug?: boolean;
  force?: boolean;
  executablePath: string;
  quality: number;
  subtitle: string;
  subtitleOnly: boolean;
};

export type Provider = FlixHQ['name'] | MovieHdWatch['name'];
export type ISupportedProvider = FlixHQ | MovieHdWatch;
export interface IBaseProvider {
  options: OptionsType;
  query: string;
  provider: ISupportedProvider;
  searchPath: string;
  providerName: 'flixhq' | 'moviehdwatch' | 'vidsrcto' | 'hdrezka' | 'warezcdn';
}

export type MovieWebBaseProviderType = Omit<IBaseProvider, 'provider'>;

export interface IProvider {
  options: OptionsType;
  query: string;
  provider: string;
}

export type SourcererEmbeds = Pick<SourcererOutput, 'embeds'>['embeds'];
export type SourcererEmbed = SourcererEmbeds[0];

export type StreamWithQulaities = Stream & {
  qualities: [{ url: string; resolution: string }];
};

export interface StreamInfo {
  [resolution: number]: {
    url: string;
    type: string;
  };
}

export interface Quality {
  [resolution: number]: {
    url: string;
    type: string;
  };
}

export interface IHandleStream {
  handleEmbeds(
    embeds: SourcererEmbeds,
    media: any
  ): Promise<StreamWithQulaities | undefined>;
}
