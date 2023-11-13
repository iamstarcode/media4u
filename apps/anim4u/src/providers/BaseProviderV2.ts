import {
  IAnimeEpisode,
  IAnimeInfo,
  IAnimeResult,
  ISource,
  IVideo,
  MediaFormat,
} from '@consumet/extensions';
import { readFileSync } from 'fs';
import path from 'path';
import { IBaseProvider, ISupportedProvider, OptionsType } from '../types';
import fs from 'node:fs';

import ora, { Ora } from 'ora';
import _ from 'lodash';

import inquirer from 'inquirer';
import inquirerSearchList from 'inquirer-search-list';
import chalk from 'chalk';
import {
  createFileIfNotFound,
  createFolderIfNotFound,
  sanitizeFileName,
  sanitizeFolderName,
} from '../helpers/io/index.js';
import { m3u8Download } from '@lzwme/m3u8-dl';
import { homedir } from 'node:os';

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

    let media: IAnimeResult = await this.inquireMedia(medias);

    let quality;

    if (!this.options.quality) {
      quality = await this.inquireQuality();
    } else {
      quality = this.options.quality;
    }

    const animeInfo = await this.getAnimeInfo(media);

    await this.handleDownload(animeInfo, quality);

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
    if (this._provider == 'animepahe2') {
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
      createFileIfNotFound(
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
    const mediaPath = path.join(this.searchPath, anime.title.toString());

    spinner.text = `Searching ${chalk.yellow(anime.title.toString())} info`;
    spinner.start();

    const data: IAnimeInfo = await this.provider.fetchAnimeInfo(anime.id);
    spinner.stop();

    if (!data) {
      console.log(chalk.yellow(`No episodes found, may not be aired yet!`));
      process.exit(1);
    } else {
      console.log(chalk.yellow(anime.title) + ' info search complete \u2713');
      createFileIfNotFound(mediaPath, `links.json`, JSON.stringify(data));
    }

    return data;
  }

  getLinksPath({ animeInfo }: { animeInfo: IAnimeInfo }) {
    const linksPath = path.join(
      this.searchPath,
      animeInfo?.title.toString(),
      `links.json`
    );

    return linksPath;
  }

  getSpinner() {
    return this.spinner;
  }

  async inquireMedia(medias: IAnimeResult[]) {
    inquirer.registerPrompt('search-list', inquirerSearchList);
    const inq: IAnimeResult = await inquirer
      .prompt([
        {
          type: 'search-list',
          message: 'Select a Movie or TV show',
          name: 'title',
          askAnswered: true,
          choices: medias.map((s: IAnimeResult) => ({
            name: `${s.title}`,
            value: s.title,
          })),
        },
      ])
      .then(function (answers: { title: string }) {
        const mediaInfo: IAnimeResult = _.find(
          medias,
          (o: IAnimeResult) => o.title == answers.title
        );
        return mediaInfo;
      })
      .catch((e: any) => console.log(e));
    return inq;
  }

  async inquireQuality() {
    const ui = new inquirer.ui.BottomBar();
    const qualityRes = ['360', '480', '720', '800', '1080', '2160'];
    const inq = await inquirer
      .prompt([
        {
          type: 'list',
          message: 'Select a prefered quality',
          name: 'quality',
          choices: qualityRes.map((s) => ({
            name: `${s}p`,
            value: s,
          })),
        },
      ])
      .then(function (answer: { quality: string }) {
        return answer.quality;
      })
      .catch((e: any) => console.log(e));

    return inq;
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
    _animeInfo,
    _episode,
  }: {
    _animeInfo: IAnimeInfo;
    _episode: number;
  }): Promise<ISource | null> {
    const linksPath = this.getLinksPath({ animeInfo: _animeInfo });

    const linksString = readFileSync(linksPath).toString();
    const animeInfo: IAnimeInfo = JSON.parse(linksString);

    const episode: IAnimeEpisode = _.find(
      animeInfo.episodes,
      (o: IAnimeEpisode) => o.number == _episode
    );

    if (!episode) {
      return null;
    }

    let data: ISource;

    data = await this.provider.fetchEpisodeSources(episode.id);

    return data;
  }

  async handleDownload(animeInfo: IAnimeInfo, quality: string) {
    const spinner = this.getSpinner();

    for (let i = 0; i < this.options.episodes.length; i++) {
      let choosen;
      let sources: ISource | null;

      let type: 'TV' | 'TV/Movie' | '' = '';
      const episode = this.options.episodes[i];

      if (animeInfo.episodes && animeInfo.episodes.length > 1) {
        type = 'TV';
      } else if (
        (animeInfo.episodes && animeInfo.type == MediaFormat.MOVIE) ||
        animeInfo.episodes?.length == 1
      ) {
        type = 'TV/Movie';
      }

      if (type === 'TV') {
        spinner.text = `Searching for ${chalk.yellow(
          animeInfo.title
        )} episode ${chalk.yellow(episode)} download link`;
        spinner.start();

        /*   spinner = this.getSpinner(
          `Searching for ${chalk.yellow(
            animeInfo.title
          )} episode ${chalk.yellow(episode)} download link`
        ); */

        sources = await this.getEpisodeSources({
          _animeInfo: animeInfo,
          _episode: episode,
        });
      } else {
        spinner.text = `Searching for ${chalk.yellow(
          animeInfo.title
        )} movie or episode download link`;
        spinner.start();
        /*   spinner = this.getSpinner(
          `Searching for ${chalk.yellow(
            animeInfo.title
          )} movie or episode download link`
        ); */

        sources = await this.getEpisodeSources({
          _animeInfo: animeInfo,
          _episode: 1,
        });
      }

      //spinner.stop();
      spinner.stop();

      if (sources == null && type == 'TV') {
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

        console.log(
          'Episode might not be available yet, or try forcing a refresh the -f flag!'
        );

        break;
      } else if (sources == null && type == 'TV/Movie') {
        console.log(
          chalk.red(`Could not find movie or episode 1, please try again!`)
        );
      } else if (sources != null) {
        choosen = this.getChoosenQuality(sources.sources, parseInt(quality));

        if (type == 'TV/Movie') {
          await this.saveAsMovie(animeInfo, 1, choosen, sources);
        }
        if (type == 'TV') {
          await this.saveAsSeries(animeInfo, episode, choosen, sources);
        }
      }
    }
  }

  async saveAsSeries(
    animeInfo: IAnimeInfo,
    episode: number,
    choosen: IVideo,
    sources: ISource
  ) {
    createFolderIfNotFound(`${sanitizeFolderName(animeInfo.title.toString())}`);
    console.log(
      `Now downloading: ${chalk.yellow(animeInfo.title)} Episode ${chalk.yellow(
        episode
      )} `
    );
    const dir = `'${path.join(animeInfo.title.toString())}'`;

    const cacheDir = path.join(homedir(), 'anim4u', this._provider, 'cache');
    await m3u8Download(choosen.url, {
      showProgress: true,
      filename: `E${episode}`,
      saveDir: dir,
      cacheDir,
      headers: sources.headers,
    });

    this.clearDownloadCache(cacheDir, episode);
  }

  async saveAsMovie(
    animeInfo: IAnimeInfo,
    episode: number,
    choosen: IVideo,
    sources: ISource
  ) {
    console.log(
      'Episode ' + chalk.yellow(episode) + ' link search complete \u2713'
    );

    console.log(`${chalk.yellow(animeInfo.title)} link search complete \u2713`);

    const name: string = animeInfo.title.toString();
    const regex = new RegExp(' ', 'g');
    const result = name.replace(regex, '-');

    console.log(`Now downloading: ${chalk.yellow(animeInfo.title)}`);
    await m3u8Download(choosen.url, {
      showProgress: true,
      filename: sanitizeFileName(result),
      delCache: true,
      cacheDir: path.join(homedir(), 'anim4u', this._provider, 'cache'),
      headers: sources.headers,
    });
  }

  clearDownloadCache(folderPath: string, episode: number) {
    try {
      const files = fs.readdirSync(folderPath);

      files.forEach((file) => {
        if (file.includes(`-ep.${episode}`)) {
          const filePath = path.join(folderPath, file);

          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error(`Error deleting file ${file}:`, err);
          }
        }
      });
    } catch (err) {
      console.error('Error reading folder:', err);
    }
  }
}
