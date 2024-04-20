import { MOVIES } from '@consumet/extensions';
import _ from 'lodash';

import { BaseProvider } from './BaseProvider.js';
import { homedir } from 'os';
import path from 'path';

import {
  IBaseProvider,
  IHandleStream,
  IProvider,
  MovieWebBaseProviderType,
  SourcererEmbeds,
  StreamWithQulaities,
} from '../types/index.js';
import { BaseMovieWebProvider } from './BaseMovieWebProvider.js';
import {
  makeProviders,
  makeStandardFetcher,
  Stream,
  targets,
} from '@movie-web/providers';
import { m3u8Download } from '@lzwme/m3u8-dl';
import { CLI, IO } from '@iamstarcode/4u-lib';
import { appPath } from '../config/constants.js';
import chalk from 'chalk';
import { vidplayExtractor } from '../utils/embed-extractors.js';

interface StreamInfo {
  resolution: string;
  url: string;
}

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
      searchPath: path.join(appPath, 'VidSrcTo', 'Searches'),
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
        const streamWithQualities = await vidplayExtractor(
          output.stream[0] as any
        );
        if (streamWithQualities) {
          return streamWithQualities;
        }
      }
    }
    return undefined;

    // throw new Error('Method not implemented.');
    /*    const output = await providers.runSourceScraper({
    media: media,
    id: provider,
  }); */
    /*     for (const embed of embeds) {
      //console.log(embed.embedId);
      const output: any = await providers.runEmbedScraper({
        id: embed.embedId,
        url: embed.url,
      });
      if (embed.embedId == 'vidplay') {
        const streamWithQualities = await vidplayExtractor(
          output.stream[0]
        );
        console.log(streamWithQualities, 'dcnjcnjfcnj');
      }
    } */
  }
  // handleEmbeds (embeds: { embedId: string; url: string }[]) => Promise<void>;

  //rename to get Stream
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

    const output = await providers.runSourceScraper({
      media: media,
      id: provider,
    });

    let playist = {};
    if (output.stream || output.embeds) {
      if (output.stream) {
        //handle stream
      } else {
        //handle embeds
        for (const embed of output.embeds) {
          //console.log(embed.embedId);
          const output: any = await providers.runEmbedScraper({
            id: embed.embedId,
            url: embed.url,
          });
          if (embed.embedId == 'vidplay') {
            const streamWithQualities = await vidplayExtractor(
              output.stream[0]
            );
          }
        }
      }
    }
    if (output.stream) {
      const res = await this.extractResolutionAndUrl('dfenfjehfj');
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

      /*     if (this.options.subtitleOnly) {
        CLI.printInfo('Downloading Subtitle...');
        await this.downloadSubtitle(output.stream.captions, media);
      } else {
        await IO.downloadStream({
          url: closestStream?.url!,
          cacheDir,
          headers: output.stream.headers,
          media,
        });
        if (this.options.subtitle) {
          await this.downloadSubtitle(output.stream.captions, media);
        }
        console.log(
          chalk.greenBright.bold(
            `${chalk.blue('[INFO]')}Download complete \u2713 `
          )
        );
      } */
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
