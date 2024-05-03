import _ from 'lodash';

import path from 'path';

import {
  IBaseProvider,
  IHandleStream,
  SourcererEmbeds,
  StreamWithQulaities,
} from '../types/index.js';
import { BaseMovieWebProvider } from './BaseMovieWebProvider.js';
import { Stream } from '@movie-web/providers';
import { appPath } from '../config/constants.js';

export default class VidSrcToProvider
  extends BaseMovieWebProvider
  implements IHandleStream
{
  constructor({
    options,
    query,
  }: Omit<IBaseProvider, 'searchPath' | 'provider' | 'providerName'>) {
    super({
      options,
      query,
      searchPath: path.join(appPath, 'Searches'),
      providerName: 'vidsrcto',
    });
  }

  override async handleEmbeds(
    embeds: SourcererEmbeds
  ): Promise<StreamWithQulaities | undefined> {
    for (const embed of embeds) {
      const output = await this.getProviders().runEmbedScraper({
        id: embed.embedId,
        url: embed.url,
      });
      if (embed.embedId == 'vidplay') {
        const streamWithQualities = await this.vidplayExtractor(
          output.stream[0] as any
        );
        if (streamWithQualities) {
          return streamWithQualities;
        }
      }
    }
    return undefined;
  }

  async vidplayExtractor(
    stream: Stream & { playlist: string }
  ): Promise<StreamWithQulaities> {
    const response = await fetch(stream.playlist);
    const data = await response.text();
    const lines = data.split('\n');

    let qualities = {};
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXT-X-STREAM-INF')) {
        const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);

        if (resolutionMatch) {
          const resolution = resolutionMatch[1];
          const right = resolutionMatch[1].substring(
            resolution.indexOf('x') + 1
          );
          let url = lines[i + 1].trim();
          const index = stream.playlist.lastIndexOf('/h/');
          if (index !== -1) {
            url = stream.playlist.slice(0, index) + `/h/${url}`;
          }
          qualities = { ...qualities, [+right]: { resolution, url } };
          //  qualities?.push({ [+right]: { resolution, url } });
        }
      }
    }

    const streamWithQualities = {
      ...stream,
      qualities: qualities as [{ url: string; resolution: string }],
    };
    return streamWithQualities;
    //return streamInfos;
  }
}
