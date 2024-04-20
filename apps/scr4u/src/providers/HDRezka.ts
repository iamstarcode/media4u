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

export default class HDRezka extends BaseMovieWebProvider {
  constructor({
    options,
    query,
  }: Omit<IBaseProvider, 'searchPath' | 'provider' | 'providerName'>) {
    super({
      options,
      query,
      searchPath: path.join(appPath, 'HDRezka', 'Searches'),
      providerName: 'hdrezka',
    });
  }

  makeCustomFetcher(): Fetcher {
    const fetcher = makeStandardFetcher(fetch);

    ///console.log(url, 'nnjnjnjj');
    /*    const url = '/engine/ajax/search.php';
    const ops = {
      headers: {
        'X-Hdrezka-Android-App': '1',
        'X-Hdrezka-Android-App-Version': '2.2.0',
      },
      baseUrl: 'https://hdrzk.org',
      query: { q: 'Evil' },
      //readHeaders: [],
      //method: 'HEAD',
    } as any; */
    const customFetcher: Fetcher = (url, ops) => {
      return fetcher(url, ops);
    };

    return customFetcher;
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
      consistentIpForRequests: true,
      //proxiedFetcher: this.makeCustomFetcher(url, ops),
    });

    const output: any = await providers.runSourceScraper({
      id: provider,
      media: media as any,
    });

    console.log(output.stream[0].qualities);
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
