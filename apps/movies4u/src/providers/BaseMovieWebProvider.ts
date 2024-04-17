import { MovieWebBaseProviderType, OptionsType } from '../types';
import fs, { readFileSync } from 'node:fs';
import path from 'path';
import Spinner from '../utils/spinner';
import { IMovieResult } from '@consumet/extensions';
import { CLI, IO, Util } from '@iamstarcode/4u-lib';
import chalk from 'chalk';
import ora, { Ora } from 'ora';

import ffmpeg from 'fluent-ffmpeg';

import { SingleBar } from 'cli-progress';

import {
  targets,
  makeProviders,
  makeStandardFetcher,
  SourceRunnerOptions,
  Stream,
  EmbedScrapeContext,
  NotFoundError,
} from '@movie-web/providers';
import { title } from 'node:process';
import { m3u8Download } from '@lzwme/m3u8-dl';

interface IMediResult {
  external_ids: any;
  id: number;
  type: 'tv' | 'movie';
  title: string;
  first_air_date: string;
}

interface ISeason {
  air_date: string;
  episode_count: number;
  id: number;
}
interface IMediaInfo {
  external_ids: any;
  title: string;
  type: 'tv' | 'movie';
  id?: number;
  first_air_date: string;
  number_of_episodes?: number;
  number_of_seasons?: number;
  seasons?: ISeason[];
}
export class BaseMovieWebProvider {
  options: OptionsType;
  searchPath: string;
  query: string;
  providerName;
  API_BASE_URL: string;
  spinner: Ora;

  constructor({
    options,
    searchPath,
    query,
    providerName,
  }: MovieWebBaseProviderType) {
    const url = 'http://localhost:8000';
    //const url = 'https://tmdb-api-brown.vercel.app';
    this.options = options;
    this.searchPath = searchPath;
    this.query = query;
    this.providerName = providerName;
    this.API_BASE_URL = url;
    this.spinner = ora({ spinner: 'dots12' });
  }

  async getMedia(): Promise<IMediResult[]> {
    if (this.options.force) {
      return await this.fetchMedia();
    } else {
      if (!fs.existsSync(path.join(this.searchPath, `${this.query}.json`))) {
        return await this.fetchMedia();
      }
      const seasonsString = readFileSync(
        path.join(this.searchPath, `${this.query}.json`)
      ).toString();
      return JSON.parse(seasonsString);
    }
  }

  async fetchMedia(): Promise<IMediResult[]> {
    const spinner = this.getSpinner();
    let providerColor;

    if (this.providerName == 'vidsrcto') {
      providerColor = chalk.hex('#79c142')(this.providerName);
    }

    const searchText = `Searching ${chalk.yellow(
      this.query
    )} from ${providerColor} `;

    spinner.text = searchText;
    spinner.start();

    const apiURL = new URL(`${this.API_BASE_URL}/search`);
    apiURL.searchParams.append('query', this.query);
    const response = await fetch(apiURL.toString(), {
      method: 'GET',
    });

    const data = await response.json();

    const medias = data.data;

    spinner.stop();
    console.log(chalk.green(`Search complete \u2713`));

    if (medias == undefined || medias.length < 0) {
      console.log(chalk.red(`Nothing found \u2715 `));
      return [];
    } else {
      IO.createFileIfNotFound(
        this.searchPath,
        `${this.query}.json`,
        JSON.stringify(medias)
      );
      return medias;
    }
  }

  async run() {
    const medias: IMediResult[] = await this.getMedia();

    let media: IMediResult = await CLI.inquireMedia(medias);

    let quality;

    if (!this.options.quality) {
      quality = await CLI.inquireQuality();
    } else {
      quality = this.options.quality;
    }

    ////
    //
    const mediaInfo: IMediaInfo = await this.getMediaInfo(media);

    await this.handleDownload({ mediaInfo, quality: this.options.quality });

    if (mediaInfo.type == 'tv') {
    }
  }

  async getMediaInfo(mediaResult: IMediResult): Promise<IMediaInfo> {
    const mediaPath = path.join(
      this.searchPath,
      IO.sanitizeDirName(mediaResult.title)
    );
    const linksPath = path.join(
      this.searchPath,
      IO.sanitizeDirName(mediaResult.title),
      `links.json`
    );

    if (this.options.force) {
      const data = await this.fetchMediaInfo(mediaResult);
      return data;
    } else {
      if (!fs.existsSync(path.join(mediaPath, 'links.json'))) {
        const data = await this.fetchMediaInfo(mediaResult);

        return data;
      } else {
        const linksString = readFileSync(linksPath).toString();
        const movieInfo: IMediaInfo = JSON.parse(linksString);
        return movieInfo;
      }
    }
  }

  async fetchMediaInfo(mediaResult: IMediResult): Promise<IMediaInfo> {
    const spinner = this.getSpinner();
    const mediaPath = path.join(
      this.searchPath,
      IO.sanitizeDirName(mediaResult.title)
    );

    spinner.text = `Searching ${chalk.yellow(mediaResult.title)} info`;
    spinner.start();

    //handle for movie too here
    const response = await fetch(`${this.API_BASE_URL}/tv/${mediaResult.id}`);

    const data: any = await response.json();

    const mediaInfo: IMediaInfo = {
      type: mediaResult.type,
      id: mediaResult.id,
      title: mediaResult.title,
      first_air_date: mediaResult.first_air_date,
      external_ids: data.external_ids,
    };

    if (mediaResult.type == 'tv') {
      mediaInfo.seasons = data.seasons;
      mediaInfo.number_of_episodes = data.number_of_episodes;
      mediaInfo.number_of_seasons = data.number_of_seasons;
    }

    spinner.stop();

    if (!data) {
      console.log(chalk.yellow(`No episodes found, may not be aired yet!`));
      process.exit(1);
    } else {
      console.log(
        chalk.yellow(mediaResult.title) + ' info search complete \u2713'
      );
      IO.createFileIfNotFound(
        mediaPath,
        `links.json`,
        JSON.stringify(mediaInfo)
      );
    }

    return mediaInfo;
  }

  async handleDownload({
    mediaInfo,
    quality,
  }: {
    mediaInfo: IMediaInfo;
    quality: number;
  }) {
    const spinner = this.getSpinner();

    if (mediaInfo.type == 'movie') {
    } else {
      //console.log(mediaInfo, 'edededed');
      // console.log(this.options.selectedEpisodes);
      for (let i = 0; i < this.options.selectedEpisodes.length; i++) {
        const season = this.options.selectedEpisodes[i];

        if (season.season > mediaInfo.number_of_seasons!) {
          continue;
        } else {
          //or we do it here
          //console.log(mediaInfo);
          const response = await fetch(
            `${this.API_BASE_URL}/tv/${mediaInfo.id}/season/${season.season}`
          );

          const seasonData = await response.json();
          const allSeasonEpisodes: any[] = seasonData.episodes;

          for (let j = 0; j < season.episodes.length; j++) {
            const episode = season.episodes[j];
            const foundEpisode = allSeasonEpisodes.find(
              (item) => item.episode_number == episode
            );

            //console.log(foundEpisode, 'fnefnefni');
            const media: any = {
              title: mediaInfo.title,
              releaseYear: 2005,
              tmdbId: mediaInfo.id,
              type: 'show',
              imdbId: mediaInfo.external_ids.imdb_id,
              episode: {
                number: foundEpisode.episode_number,
                title: foundEpisode.name!,
                tmdbId: foundEpisode.id,
              },
              season: {
                number: seasonData.season_number,
                title: 'Book One: Water',
                tmdbId: seasonData.id,
              },
            };

            await this.providerDownload({ provider: this.providerName, media });

            /*  const streamUrl =
              'https://pdrz.v421c6e485f.site/_v2-lrld/12a3c523fc105800ed8c394685aeeb0b9b2ea15c00bdbeed0a0e7baea93ece832257df1a4b6125fcfa38c35da05dee86aad28d46d73fc4e9d4e5a53a5277f3d537c512e30918b40d5691a6b039107b126566d1700700379a93d9e159d4e62e9a7942a11c563de701f1ad6d5de2/h/ecddaaeae1/ccdeeffb;15a38634f803584ba8926411d7bee906856cab0654b5b7.m3u8'; // Replace with your stream URL
            const outputFileName = 'output.mp4'; // Output file name
            const headers = {
              Referer: 'https://vid30c.site',
              Origin: 'https://vid30c.site',
            };

            this.downloadStreamWithHeaders(streamUrl, headers, outputFileName); */

            /*   await m3u8Download('', {
              showProgress: true,
              filename: `Ejj`,
              //saveDir: `'${saveDir}'`,
              // cacheDir,
              headers: {
                Referer: 'https://vid30c.site',
                Origin: 'https://vid30c.site',
              },
            }); */
          }
        }
      }
    }
  }

  async providerDownload({}: { provider: string; media: any }): Promise<void> {}

  getSpinner() {
    return this.spinner;
  }

  async downloadStreamWithHeaders({
    streamUrl,
    headers,
    media,
  }: {
    streamUrl: any;
    headers: any;
    media: any;
  }) {
    const progressBar = new SingleBar({
      format:
        '{percentage}% [{bar}] | ETA: {eta}s {downloaded} {speed}/s {timemark}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      barsize: 20,
    });

    let filePath = '';

    if (media.type == 'movie') {
      filePath = media.name;
    } else {
      let episodeString = '';
      let seasonString = '';
      if (media.episode.number < 10) {
        seasonString = '0' + media.episode.number;
      } else {
        seasonString = media.season.number + '';
      }
      if (media.episode.number! < 10) {
        episodeString = '0' + media.episode.number;
      }
      const dir = path.join(
        IO.sanitizeDirName(media.title),
        'S' + seasonString + ''
      );
      IO.createDirIfNotFound(dir);

      // console.log(seasonString, episodeString);
      filePath = path.join(dir, 'E' + episodeString + '.mp4');
    }

    // `Downloading ${mediaName} Season ${episode.season} Episode ${episode.episodeNumber}`

    await new Promise<void>(async (resolve, reject) => {
      ffmpeg(streamUrl)
        .seekInput('20:00')
        .setDuration(10)
        .addInputOption(
          '-headers',
          Object.entries(headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\r\n')
        )
        .on('start', () => {
          console.log(
            `Downloading ${media.title} Season ${chalk.yellow(
              media.season.number
            )} Episode ${chalk.yellow(media.episode.number)}`
          );
          progressBar.start(100, 0);
        })
        .on('progress', ({ percent, currentKbps, targetSize, timemark }) => {
          progressBar.update(Math.round(percent), {
            speed: Util.humanFileSize(currentKbps),
            downloaded: Util.humanFileSize(targetSize * 1024),
            timemark: Util.formatTime(timemark),
          });
        })
        .on('error', (err) => {
          console.error('Error:', err);
          reject(err);
        })
        .on('end', () => {
          progressBar.update(100);
          progressBar.stop();
          console.log(chalk.greenBright.bold(`Download complete \u2713 `)); //

          resolve();
        })
        .save(filePath);
    });
  }

  buildHeadersFromStream(stream: Stream): Record<string, string> {
    const headers: Record<string, string> = {};
    Object.entries(stream.headers ?? {}).forEach((entry) => {
      headers[entry[0]] = entry[1];
    });
    Object.entries(stream.preferredHeaders ?? {}).forEach((entry) => {
      headers[entry[0]] = entry[1];
    });
    return headers;
  }

  async getVideowlUrlStream(decryptedId: string) {
    const sharePage = await fetch(
      'https://cloud.mail.ru/public/uaRH/2PYWcJRpH'
    );
    /*  const regex = /"videowl_view":\{"count":"(\d+)","url":"([^"]+)"\}/g;
    const videowlUrl = regex.exec(sharePage)?.[2];

    if (!videowlUrl) throw new NotFoundError('Failed to get videoOwlUrl');

    return `${videowlUrl}/0p/${btoa(decryptedId)}.m3u8?${new URLSearchParams({
      double_encode: '1',
    })}`; */
  }
}
