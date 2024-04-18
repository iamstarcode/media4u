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
import {
  makeProviders,
  makeStandardFetcher,
  targets,
} from '@movie-web/providers';
import { m3u8Download } from '@lzwme/m3u8-dl';
import { CLI, IO } from '@iamstarcode/4u-lib';
import { appPath } from '../config/constants.js';

interface StreamInfo {
  resolution: string;
  url: string;
}

export class VidSrcToProvider extends BaseMovieWebProvider {
  constructor({
    options,
    query,
  }: Omit<IBaseProvider, 'searchPath' | 'provider' | 'providerName'>) {
    super({
      options,
      query,
      searchPath: path.join(appPath, 'VidSrcTo', 'Searches'),
      providerName: 'vidsrcto',
    });
  }

  override async providerDownload({
    provider,
    media,
  }: {
    provider: string;
    media: any;
  }): Promise<void> {
    const providers = makeProviders({
      fetcher: makeStandardFetcher(fetch),
      target: targets.ANY,
    });

    const output: any = await providers.runAll({
      media: media,
      sourceOrder: [provider],
    });

    console.log(output.stream.captions, 'kjkjiji');

    if (output.stream) {
      const res = await this.extractResolutionAndUrl(output.stream.playlist);
      const closestStream = this.findClosestResolution(
        this.options.quality,
        res
      );

      const titleToDir = IO.sanitizeDirName(
        Buffer.from(closestStream?.url!).toString('base64').substring(0, 24)
      );

      const cacheDir = path.join(
        appPath,
        this.providerName,
        'cache',
        titleToDir
      );

      //sxmkemikfrf cbd cbdc
      ///ndhcbhfvbtrhugghtrbgh//sjsj
      await CLI.donwloadStream({
        url: closestStream?.url!,
        cacheDir,
        headers: output.stream.headers,
        media,
      });
    }
  }

  findClosestResolution(
    resolutionInput: number,
    streamInfos: StreamInfo[]
  ): StreamInfo | null {
    if (isNaN(resolutionInput)) {
      return null;
    }

    let closestStream: StreamInfo | null = null;
    let minDiff = Infinity;

    for (const streamInfo of streamInfos) {
      const resolutionParts = streamInfo.resolution.split('x');
      const resolutionValue = parseInt(resolutionParts[1]);
      const diff = Math.abs(resolutionInput - resolutionValue);

      if (diff < minDiff) {
        minDiff = diff;
        closestStream = streamInfo;
      }
    }

    return closestStream;
  }

  async extractResolutionAndUrl(playlistUrl: string): Promise<StreamInfo[]> {
    const response = await fetch(playlistUrl);
    const data = await response.text();
    const lines = data.split('\n');
    const streamInfos: StreamInfo[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXT-X-STREAM-INF')) {
        const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);
        if (resolutionMatch) {
          const resolution = resolutionMatch[1];
          let url = lines[i + 1].trim();
          const index = playlistUrl.lastIndexOf('/h/');
          if (index !== -1) {
            url = playlistUrl.slice(0, index) + `/h/${url}`;
          }

          const streamInfo: StreamInfo = { resolution, url };
          streamInfos.push(streamInfo);
        }
      }
    }

    return streamInfos;
  }
}
