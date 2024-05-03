import _ from 'lodash';

import path from 'path';

import {
  IBaseProvider,
  IHandleStream,
  SourcererEmbeds,
  StreamWithQulaities,
} from '../types/index.js';
import { BaseMovieWebProvider } from './BaseMovieWebProvider.js';
import {
  Fetcher,
  makeProviders,
  makeStandardFetcher,
  Stream,
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
  override async handleEmbeds(
    embeds: { embedId: string; url: string }[]
  ): Promise<StreamWithQulaities | undefined> {
    for (const embed of embeds) {
      const output = await this.getProviders().runEmbedScraper({
        id: embed.embedId,
        url: embed.url,
      });
      if (embed.embedId == 'warezcdnembedhls') {
        const streamWithQualities = await this.warezcdnembedhlsExtractor(
          output.stream[0] as any
        );
        if (streamWithQualities) {
          return streamWithQualities;
        }
      }
    }

    return undefined;
  }

  async warezcdnembedhlsExtractor(
    stream: Stream & { playlist: string }
  ): Promise<StreamWithQulaities | undefined> {
    const playlist = stream.playlist;
    const response = await fetch(stream.playlist);
    const data = await response.text();
    const lines = data.trim().split('\n');

    let qualities = {};

    let currentResolution: any = null;

    const baseURL = new URL(stream.playlist);

    lines.forEach((line) => {
      if (line.startsWith('#EXT-X-STREAM-INF')) {
        const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);
        if (resolutionMatch) {
          currentResolution = resolutionMatch[1];
        }
      } else if (line.startsWith('/') && currentResolution) {
        const url = baseURL.protocol + '//' + baseURL.host + line;
        const right = currentResolution.substring(
          currentResolution.indexOf('x') + 1
        );
        qualities = {
          ...qualities,
          [+right]: { resolution: currentResolution, url },
        };
        currentResolution = null;
      }
    });

    const streamWithQualities = {
      ...stream,
      qualities: qualities as [{ url: string; resolution: string }],
    };

    return streamWithQualities;
  }
}
