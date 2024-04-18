import {
  IAnimeEpisode,
  IAnimeInfo,
  IAnimeResult,
  ISource,
  ITitle,
  IVideo,
  MediaFormat,
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
import { IO, CLI } from '@iamstarcode/4u-lib';

export interface IGetMediType {
  type?: string;
  media: IAnimeResult;
}

export interface IGetEpisodeSources {
  animeInfo: IAnimeInfo;
  episode: number;
}

export interface IHandleMediaDownload {
  animeInfo: IAnimeInfo;
  type: MediaFormat;
  choosen: any;
  episode: never;
  source: ISource;
}
export class BaseProvider {
  options: OptionsType;
  query: string;
  provider: ISupportedProvider;
  searchPath: string;
  _provider: string;
  spinner: Ora;

  constructor({
    options,
    query,
    provider,
    searchPath,
    _provider,
  }: IBaseProvider) {
    this.options = options;
    this.query = query;
    this.provider = provider;
    this.searchPath = searchPath;
    this._provider = _provider;
    this.spinner = ora({ spinner: 'dots12' });
  }

  async run() {
    let medias: IAnimeResult[] = await this.getAnime();
    /// console.log(medias);
    let media: IAnimeResult = await CLI.inquireMedia(medias);

    let quality;

    if (!this.options.quality) {
      quality = await CLI.inquireQuality();
    } else {
      quality = this.options.quality;
    }

    const animeInfo = await this.getAnimeInfo(media);

    const type = await this.getMediaType({
      type: media.type?.toString(),
      media,
    });

    await this.handleDownload({ animeInfo, quality: quality.toString(), type });

    process.exit(0);
  }

  async getAnime(): Promise<IAnimeResult[]> {
    if (this.options.force) {
      return await this.fetchAnime();
    } else {
      if (!fs.existsSync(path.join(this.searchPath, `${this.query}.json`))) {
        return await this.fetchAnime();
      }
      const seasonsString = readFileSync(
        path.join(this.searchPath, `${this.query}.json`)
      ).toString();
      return JSON.parse(seasonsString);
    }
  }

  async fetchAnime(): Promise<IAnimeResult[]> {
    const spinner = this.getSpinner();
    let providerColor;
    if (this._provider == 'animepahe2' || this._provider == 'animepahe') {
      providerColor = chalk.hex('#d5015b')('Animepahe');
    } else if (this._provider == 'gogoanime') {
      providerColor = chalk.greenBright(this.provider.name);
    } else {
      providerColor = chalk.yellow(this.provider.name);
    }

    const searchText = `Searching ${chalk.yellow(
      this.query
    )} from ${providerColor} `;

    spinner.text = searchText;
    spinner.start();
    const medias: IAnimeResult[] = [];
    let page = 1;
    let hasNextPage: boolean;

    do {
      const data = await this.provider.search(this.query, page);

      if (data.hasNextPage) {
        hasNextPage = true;
        page++;
      } else {
        hasNextPage = false;
      }
      medias.push(...data.results);
    } while (hasNextPage);

    spinner.stop();
    console.log(chalk.green(`Anime search complete \u2713`));

    if (medias == undefined || medias.length < 0) {
      console.log(chalk.red(`No anime found \u2715 `));
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

  async getAnimeInfo(animeResult: IAnimeResult): Promise<IAnimeInfo> {
    const mediaPath = path.join(this.searchPath, animeResult.title.toString());
    const linksPath = path.join(
      this.searchPath,
      animeResult.title.toString(),
      `links.json`
    );

    if (this.options.force) {
      const data = await this.fetchAnimeInfo(animeResult);
      return data;
    } else {
      if (!fs.existsSync(path.join(mediaPath, 'links.json'))) {
        const data = await this.fetchAnimeInfo(animeResult);

        return data;
      } else {
        const linksString = readFileSync(linksPath).toString();
        const animeInfo: IAnimeInfo = JSON.parse(linksString);
        return animeInfo;
      }
    }
  }

  async fetchAnimeInfo(anime: IAnimeResult): Promise<IAnimeInfo> {
    const spinner = this.getSpinner();
    const mediaPath = path.join(
      this.searchPath,
      IO.sanitizeDirName(anime.title.toString())
    );

    spinner.text = `Searching ${chalk.yellow(anime.title.toString())} info`;
    spinner.start();

    const data: IAnimeInfo = await this.provider.fetchAnimeInfo(anime.id);
    spinner.stop();

    if (!data) {
      console.log(chalk.yellow(`No episodes found, may not be aired yet!`));
      process.exit(1);
    } else {
      console.log(chalk.yellow(anime.title) + ' info search complete \u2713');
      //IO.createDirIfNotFound(this.searchPath);

      IO.createFileIfNotFound(mediaPath, `links.json`, JSON.stringify(data));
    }

    return data;
  }

  getLinksPath({ title }: { title: string | ITitle }) {
    const linksPath = path.join(
      this.searchPath,
      IO.sanitizeDirName(title.toString()),
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

    const qualityRes = ['360', '480', '720', '800', '1080', '2160'];

    if (sources != null) {
      for (let i = 0; i < sources.length; i++) {
        const regexPattern = new RegExp(`(${qualityRes.join('|')})`);
        const match = sources[i].quality?.match(regexPattern);

        if (match) {
          const el = parseInt(match[1] ?? '');
          if (el >= preferedRes) {
            choosen = sources[i];
            break;
          }
          if (sources.length == i + 1) {
            choosen = sources[i];
          }
        }
      }
    }
    return choosen;
  }

  async getEpisodeSources({
    animeInfo,
    episode,
  }: IGetEpisodeSources): Promise<ISource | null> {
    const linksPath = this.getLinksPath({ title: animeInfo.title });

    const linksString = readFileSync(linksPath).toString();
    const _animeInfo: IAnimeInfo = JSON.parse(linksString);

    const _episode: IAnimeEpisode = _.find(
      animeInfo.episodes,
      (o: IAnimeEpisode) => o.number == episode
    );

    if (!_episode) {
      return null;
    }

    let data: ISource;

    data = await this.provider.fetchEpisodeSources(_episode.id);

    return data;
  }

  //By default search Animeinfo
  //But Others that uses session like Animepahe should overide this and get AnimeResult first
  //Before Anime Info
  async retryGetEpisodeSources({ animeInfo, episode }: IGetEpisodeSources) {
    //silenlty refresh cache
    const _animeInfo = await this.fetchAnimeInfo(animeInfo);
    const source = await this.getEpisodeSources({
      animeInfo: _animeInfo,
      episode,
    });

    return source;
  }

  async handleDownload({
    animeInfo,
    quality,
    type,
  }: {
    animeInfo: IAnimeInfo;
    quality: string;
    type: MediaFormat;
  }) {
    const spinner = this.getSpinner();

    for (let i = 0; i < this.options.episodes.length; i++) {
      let choosen;
      let source: ISource | null;

      const episode = this.options.episodes[i];

      if (type === MediaFormat.TV) {
        spinner.text = `Searching for ${chalk.yellow(
          animeInfo.title
        )} Episode ${chalk.yellow(episode)} download link`;
        spinner.start();
      } else {
        spinner.text = `Searching for ${chalk.yellow(
          animeInfo.title
        )} Movie download link`;
        spinner.start();
      }

      //for movies exit earlier
      if (episode > 1 && type == MediaFormat.MOVIE) {
        spinner.stop();
        console.log(chalk.yellow('You selected a movie'));
        console.log(chalk.yellow('You should remove the episode option'));
        break;
      }

      source = await this.getEpisodeSources({
        animeInfo,
        episode,
      });

      spinner.stop();

      //Check for expired sessions(Animepahe), if expired re-run without using caches i'e fecthes
      //Or just do a retry
      if (source?.sources?.length == 0) {
        const source = await this.retryGetEpisodeSources({
          animeInfo,
          episode,
        });
      }

      if (type == MediaFormat.MOVIE) {
        console.log(chalk.yellow('Movie link search complete \u2713'));
      } else {
        console.log(
          'Episode ' + chalk.yellow(episode) + ' link search complete \u2713'
        );
      }

      if (source == null && type == MediaFormat.TV) {
        console.log(
          chalk.red(
            `Could not find episode ${chalk.yellow(episode)}, please try again!`
          )
        );
        if (
          animeInfo.episodes != undefined &&
          episode > animeInfo.episodes.length
        ) {
          console.log(
            `Total available episode is ${chalk.yellow(
              animeInfo.episodes.length
            )}`
          );
        }
        console.log('Episode might not be available yet!');

        break;
      } else if (source == null && type == MediaFormat.MOVIE) {
        console.log(chalk.red(`Could not find movie, please try again!`));
      } else if (source != null) {
        choosen = this.getChoosenQuality(source.sources, parseInt(quality));

        await this.handleMediaDownload({
          animeInfo,
          episode,
          choosen,
          type,
          source,
        });
      }
    }
  }

  async handleMediaDownload({
    animeInfo,
    choosen,
    type,
    episode,
    source,
  }: IHandleMediaDownload) {
    if (type == MediaFormat.MOVIE) {
      await this.saveAsMovie(animeInfo, 1, choosen, source);
    } else {
      await this.saveAsSeries(animeInfo, episode, choosen, source);
    }
  }

  async saveAsSeries(
    animeInfo: IAnimeInfo,
    episode: number,
    choosen: IVideo,
    sources: ISource
  ) {
    const saveDir = IO.sanitizeDirName(animeInfo.title.toString());
    IO.createDirIfNotFound(saveDir);

    const titleToDir = IO.sanitizeDirName(
      Buffer.from(choosen.url).toString('base64').substring(0, 24)
    );

    console.log(
      `Now downloading: ${chalk.yellow(animeInfo.title)} Episode ${chalk.yellow(
        episode
      )} `
    );

    const cacheDir = path.join(
      homedir(),
      'anim4u',
      this._provider,
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
    animeInfo: IAnimeInfo,
    episode: number,
    choosen: IVideo,
    sources: ISource
  ) {
    console.log(`${chalk.yellow(animeInfo.title)} link search complete \u2713`);

    const titleToDir = IO.sanitizeDirName(
      Buffer.from(choosen.url).toString('base64').substring(0, 24)
    );

    const cacheDir = path.join(
      homedir(),
      'anim4u',
      this._provider,
      'cache',
      titleToDir
    );

    const name: string = animeInfo.title.toString();

    console.log(`Now downloading: ${chalk.yellow(animeInfo.title)}`);
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
