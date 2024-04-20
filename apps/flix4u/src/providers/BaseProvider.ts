import {
  IEpisodeServer,
  IMovieEpisode,
  IMovieInfo,
  IMovieResult,
  ISource,
  IVideo,
  MediaFormat,
  StreamingServers,
  TvType,
} from '@consumet/extensions';
import { readFileSync } from 'fs';
import path from 'path';
import { IBaseProvider, ISupportedProvider, OptionsType } from '../types';
import fs from 'node:fs';

import ora, { Ora } from 'ora';
import _ from 'lodash';

import chalk from 'chalk';

import { m3u8Download } from '@lzwme/m3u8-dl';
import { homedir } from 'node:os';
import { CLI, IO } from '@iamstarcode/4u-lib';

import {
  makeProviders,
  makeStandardFetcher,
  targets,
} from '@movie-web/providers';
import { appPath } from '../config/constants.js';

export interface IHandleMediaDownload {
  movieInfo: IMovieInfo;
  type: MediaFormat;
  choosen: any;
  episode: number;
  source: ISource;
}

export interface IGetMediType {
  type?: string;
  media: IMovieResult;
}
export class BaseProvider {
  options: OptionsType;
  query: string;
  provider: ISupportedProvider;
  providerName;
  searchPath: string;
  //_provider: Provider;
  spinner: Ora;

  constructor({
    options,
    query,
    provider,
    searchPath,
    providerName,
  }: IBaseProvider) {
    this.options = options;
    this.query = query;
    this.provider = provider;
    this.searchPath = searchPath;
    this.providerName = providerName;
    this.spinner = ora({ spinner: 'dots12' });
  }

  async run() {
    const providers = makeProviders({
      fetcher: makeStandardFetcher(fetch),
      target: targets.ANY, // target native app streams
    });

    const mediax: any = {
      title: 'Dr. STONE',
      releaseYear: 2019,
      tmdbId: '86031',
      type: 'show',
      imdbId: 'tt9679542',
      episode: {
        number: 3,
        title: 'Weapons of Science',
        tmdbId: '1814295',
      },
      season: {
        number: 1,
        title: 'Season 1',
        tmdbId: '117113',
      },
    };
    // scrape a stream
    const stream = await providers.runAll({
      media: mediax,
    });

    // scrape a stream, but prioritize flixhq above all
    // (other scrapers are still run if flixhq fails, it just has priority)
    const flixhqStream = await providers.runAll({
      media: mediax,
      sourceOrder: ['flixhq'],
    });

    console.log(flixhqStream, 'mxskmksxmksmxk');

    /*   const output = await providers.runEmbedScraper({
      id: 'vidcloud',
      url: 'https://flixhq.to/watch-movie/watch-hamilton-62097.2767351',
    }); */

    let medias: IMovieResult[] = await this.getMedia();

    let media: any = await CLI.inquireMedia(medias);

    let quality;

    if (!this.options.quality) {
      quality = await CLI.inquireQuality();
    } else {
      quality = this.options.quality;
    }

    const movieInfo = await this.getMediaInfo(media);

    //console.log(movieInfo, '//s');

    const type = await this.getMediaType({
      type: media.type?.toString(),
      media,
    });

    await this.handleDownload({ movieInfo, quality: quality.toString(), type });

    process.exit(0);
  }

  async getMedia(): Promise<IMovieResult[]> {
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

  async fetchMedia(): Promise<IMovieResult[]> {
    const spinner = this.getSpinner();
    let providerColor;

    if (this.providerName == 'flixhq') {
      providerColor = chalk.hex('#79c142')(this.provider.name);
    }

    const searchText = `Searching ${chalk.yellow(
      this.query
    )} from ${providerColor} `;

    spinner.text = searchText;
    spinner.start();
    const medias: IMovieResult[] = [];

    let page = 1;
    let hasNextPage: boolean;

    do {
      const data = await this.provider.search(this.query, page);
      if (page == 5) {
        break;
      }
      if (data.hasNextPage) {
        hasNextPage = true;
        page++;
      } else {
        hasNextPage = false;
      }
      medias.push(...data.results);
    } while (hasNextPage);

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

  async getMediaInfo(movieResult: IMovieResult): Promise<IMovieInfo> {
    const mediaPath = path.join(this.searchPath, movieResult.title.toString());
    const linksPath = path.join(
      this.searchPath,
      movieResult.title.toString(),
      `links.json`
    );

    if (this.options.force) {
      const data = await this.fetchMediaInfo(movieResult);
      return data;
    } else {
      if (!fs.existsSync(path.join(mediaPath, 'links.json'))) {
        const data = await this.fetchMediaInfo(movieResult);

        return data;
      } else {
        const linksString = readFileSync(linksPath).toString();
        const movieInfo: IMovieInfo = JSON.parse(linksString);
        return movieInfo;
      }
    }
  }

  async fetchMediaInfo(anime: IMovieResult): Promise<IMovieInfo> {
    const spinner = this.getSpinner();
    const mediaPath = path.join(this.searchPath, anime.title.toString());

    spinner.text = `Searching ${chalk.yellow(anime.title.toString())} info`;
    spinner.start();

    const data: IMovieInfo = await this.provider.fetchMediaInfo(anime.id);
    spinner.stop();

    if (!data) {
      console.log(chalk.yellow(`No episodes found, may not be aired yet!`));
      process.exit(1);
    } else {
      console.log(chalk.yellow(anime.title) + ' info search complete \u2713');
      IO.createFileIfNotFound(mediaPath, `links.json`, JSON.stringify(data));
    }

    return data;
  }

  getLinksPath({ movieInfo }: { movieInfo: IMovieInfo }) {
    const linksPath = path.join(
      this.searchPath,
      movieInfo?.title.toString(),
      `links.json`
    );

    return linksPath;
  }

  getSpinner() {
    return this.spinner;
  }

  getChoosenQuality(
    sources: IVideo[] | null,
    preferedRes: number
  ): { quality: string; url: string } {
    let choosen: any = {};
    const qualityRes = ['360', '480', '720', '800', '1080', '2160', 'auto'];

    const soredted = _.sortBy(sources, [
      function (o: IVideo) {
        return parseInt(o.quality ?? '');
      },
    ]);

    if (soredted != null) {
      for (let i = 0; i < soredted.length; i++) {
        const regexPattern = new RegExp(`(${qualityRes.join('|')})`);
        const match = soredted[i].quality?.match(regexPattern);

        if (match) {
          const el = parseInt(match[1] ?? '');
          if (el >= preferedRes) {
            choosen = soredted[i];
            break;
          }
          if (soredted.length == i + 1) {
            console.log('last');
            if (match[1] == 'auto') {
              choosen = soredted[i - 1];
            } else {
              choosen = soredted[i];
            }
          }
        }
      }
    }

    return choosen;
  }

  async getEpisodeServers({
    movieInfo,
    episode,
  }: {
    movieInfo: IMovieInfo;
    episode: IMovieEpisode;
  }): Promise<IEpisodeServer[]> {
    const servers = await this.provider.fetchEpisodeServers(
      episode.id,
      movieInfo.id
    );

    return servers;
  }

  getServerEnum(server: string) {
    if (server == StreamingServers.AsianLoad) {
      return StreamingServers.AsianLoad;
    } else if (server == StreamingServers.Filemoon) {
      return StreamingServers.Filemoon;
    } else if (server == StreamingServers.GogoCDN) {
      return StreamingServers.GogoCDN;
    } else if (server == StreamingServers.MixDrop) {
      return StreamingServers.MixDrop;
    } else if (server == StreamingServers.Mp4Upload) {
      return StreamingServers.Mp4Upload;
    } else if (server == StreamingServers.MyCloud) {
      return StreamingServers.MyCloud;
    } else if (server == StreamingServers.SmashyStream) {
      return StreamingServers.SmashyStream;
    } else if (server == StreamingServers.StreamHub) {
      return StreamingServers.StreamHub;
    } else if (server == StreamingServers.StreamSB) {
      return StreamingServers.StreamSB;
    } else if (server == StreamingServers.StreamTape) {
      return StreamingServers.StreamTape;
    } else if (server == StreamingServers.StreamWish) {
      return StreamingServers.StreamWish;
    } else if (server == StreamingServers.UpCloud) {
      return StreamingServers.UpCloud;
    } else if (server == StreamingServers.VidCloud) {
      return StreamingServers.VidCloud;
    } else if (server == StreamingServers.VidMoly) {
      return StreamingServers.VidMoly;
    } else if (server == StreamingServers.VidStreaming) {
      return StreamingServers.VidStreaming;
    } else if (server == StreamingServers.VizCloud) {
      return StreamingServers.VizCloud;
    }
  }

  async getEpisodeSources({
    _movieInfo,
    _episode,
  }: {
    _movieInfo: IMovieInfo;
    _episode: any;
  }): Promise<ISource | null> {
    const spinner = this.getSpinner();

    const media =
      _movieInfo.type == TvType.MOVIE ? TvType.MOVIE : TvType.TVSERIES;
    spinner.text = `Searching for ${chalk.yellow(
      _movieInfo.title
    )} ${media} download link`;

    const episode = _episode as IMovieEpisode;
    spinner.start();

    await this.provider
      .fetchEpisodeServers('1239892', 'tv/watch-from-77455')
      .then((data) => {
        console.log(data);
      });

    const srcs = await this.provider.fetchEpisodeSources(
      '1239892',
      'tv/watch-from-77455'
      //StreamingServers.MixDrop
    );

    console.log(srcs, 'ddddddddddddddda');

    spinner.stop();
    return srcs;
  }

  getLinks({ _movieInfo }: { _movieInfo: IMovieInfo }) {
    const linksPath = this.getLinksPath({ movieInfo: _movieInfo });
    const linksString = readFileSync(linksPath).toString();
    const movieInfo: IMovieInfo = JSON.parse(linksString);
    let episode: IMovieEpisode[] | null = [];

    if (movieInfo.type == TvType.MOVIE) {
      episode.push(movieInfo?.episodes![0]);
    } else if (movieInfo.type == TvType.TVSERIES) {
      for (let i = 0; i < this.options.episodes.length; i++) {
        const season = this.options.episodes[i].season;
        const allSeasonEpisodes = _.filter(
          movieInfo.episodes,
          (o: IMovieEpisode) => o.season == season
        );

        if (allSeasonEpisodes.length == 0) {
          this.options.episodes[i].notFound = true;
        }

        for (let j = 0; j < this.options.episodes[i].episodes.length; j++) {
          const element = _.find(
            allSeasonEpisodes,
            (o: IMovieEpisode) =>
              o.number == this.options.episodes[i].episodes[j]
          );

          if (!element) {
            this.options.episodes[i].episodes[j] = {
              number: this.options.episodes[i].episodes[j],
              notFound: true,
            };
          } else {
            this.options.episodes[i].episodes[j] = element;
          }
        }
      }
    }

    /*     if (!episode) {
      return null;
    }

    return episode; */
  }

  async handleDownload({
    movieInfo,
    quality,
    type,
  }: {
    movieInfo: IMovieInfo;
    quality: string;
    type: MediaFormat;
  }) {
    const spinner = this.getSpinner();

    /*   console.log(
      movieInfo,
      TvType.MOVIE.toLocaleLowerCase(),
      movieInfo.type?.toLocaleLowerCase(),
      'jjjjjjjjjx'
    ); */

    if (
      movieInfo.type?.toLocaleLowerCase() == TvType.MOVIE.toLocaleLowerCase()
    ) {
      spinner.text = `Searching for ${chalk.yellow(
        movieInfo.title
      )} Movie link`;
      spinner.start();

      let sources: ISource | null;

      spinner.start();

      sources = await this.getEpisodeSources({
        _movieInfo: movieInfo,
        _episode: this.options.episodes,
      });

      ///
      spinner.stop();
    } else if (movieInfo.type == TvType.TVSERIES) {
      //TODO find a better name
      this.getLinks({ _movieInfo: movieInfo });

      for (let i = 0; i < this.options.episodes.length; i++) {
        const season = this.options.episodes[i];

        if (season.notFound) {
          continue;
        } else {
          for (let j = 0; j < season.episodes.length; j++) {
            const episode = season.episodes[j];

            if (!episode.notFound) {
              //we have an episode else proceed to down
              //fetch episode sources

              const srcs = await this.getEpisodeSources({
                _movieInfo: movieInfo,
                _episode: episode,
              });

              let choosen: IVideo;
              if (srcs != null) {
                choosen = this.getChoosenQuality(
                  srcs.sources,
                  parseInt(quality)
                );

                await this.handleMediaDownload({
                  movieInfo,
                  episode: episode.number,
                  choosen,
                  type,
                  source: srcs,
                });
              }
            } else {
              // console.log(element.notFound, element);
              //TODO to show

              continue;
            }
          }
        }
      }
    }
  }

  async handleMediaDownload({
    movieInfo,
    choosen,
    type,
    episode,
    source,
  }: IHandleMediaDownload) {
    if (type == MediaFormat.MOVIE) {
      await this.saveAsMovie(movieInfo, 1, choosen, source);
    } else {
      await this.saveAsSeries(movieInfo, episode, choosen, source);
    }
  }

  async saveAsSeries(
    movieInfo: IMovieInfo,
    episode: number,
    choosen: IVideo,
    sources: ISource
  ) {
    const saveDir = IO.sanitizeDirName(movieInfo.title.toString());
    IO.createDirIfNotFound(saveDir);

    const titleToDir = IO.sanitizeDirName(
      Buffer.from(choosen.url).toString('base64').substring(0, 24)
    );

    console.log(
      `Now downloading: ${chalk.yellow(movieInfo.title)} Episode ${chalk.yellow(
        episode
      )} `
    );

    const cacheDir = path.join(
      appPath,
      this.providerName,
      'cache',
      titleToDir,
      'E' + episode
    );

    IO.createDirIfNotFound(cacheDir);

    await m3u8Download(choosen.url, {
      showProgress: true,
      filename: `E${episode}`,
      saveDir: `'${saveDir}'`,
      cacheDir,
      headers: sources.headers,
    });

    this.clearDownloadCache(cacheDir);
  }

  async saveAsMovie(
    movieInfo: IMovieInfo,
    episode: number,
    choosen: IVideo,
    sources: ISource
  ) {
    console.log(`${chalk.yellow(movieInfo.title)} link search complete \u2713`);

    const titleToDir = IO.sanitizeDirName(
      Buffer.from(choosen.url).toString('base64').substring(0, 24)
    );

    const cacheDir = path.join(appPath, this.providerName, 'cache', titleToDir);

    const name: string = movieInfo.title.toString();

    console.log(`Now downloading: ${chalk.yellow(movieInfo.title)}`);
    await m3u8Download(choosen.url, {
      showProgress: true,
      filename: IO.sanitizeFileName(name),
      cacheDir,
      headers: sources.headers,
    });

    this.clearDownloadCache(cacheDir);
  }

  clearDownloadCache(cacheDir: string) {
    if (fs.existsSync(cacheDir)) {
      const files = fs.readdirSync(cacheDir);

      files.forEach((file) => {
        const filePath = path.join(cacheDir, file);
        fs.unlinkSync(filePath);
      });

      fs.rmdirSync(cacheDir);
    } else {
      console.log(`Folder ${cacheDir} not found.`);
    }
  }

  async getMediaType({ type }: IGetMediType) {
    if (type?.toLocaleLowerCase().includes('movie')) {
      return MediaFormat.MOVIE;
    } else return MediaFormat.TV;
  }
}
