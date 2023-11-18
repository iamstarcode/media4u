import {
  IEpisodeServer,
  IMovieEpisode,
  IMovieInfo,
  IMovieResult,
  ISource,
  IVideo,
  StreamingServers,
  TvType,
} from '@consumet/extensions';
import { readFileSync } from 'fs';
import path from 'path';
import {
  IBaseProvider,
  ISupportedProvider,
  OptionsType,
  Provider,
} from '../types';
import fs from 'node:fs';

import ora, { Ora } from 'ora';
import _ from 'lodash';

import inquirer from 'inquirer';
import inquirerSearchList from 'inquirer-search-list';
import chalk from 'chalk';
import {
  createFileIfNotFound,
  createFolderIfNotFound,
} from '../helpers/io/index.js';
import { m3u8Download } from '@lzwme/m3u8-dl';
import { homedir } from 'node:os';

export class BaseProvider {
  options: OptionsType;
  query: string;
  provider: ISupportedProvider;
  searchPath: string;
  _provider: Provider;
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
    let medias: IMovieResult[] = await this.getMedia();

    let media: IMovieResult = await this.inquireMedia(medias);

    let quality;

    if (!this.options.quality) {
      quality = await this.inquireQuality();
    } else {
      quality = this.options.quality;
    }

    const movieInfo = await this.getMediaInfo(media);

    await this.handleDownload(movieInfo, quality);

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

    if (this._provider == 'FlixHQ') {
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
      createFileIfNotFound(mediaPath, `links.json`, JSON.stringify(data));
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

  async inquireMedia(medias: IMovieResult[]) {
    inquirer.registerPrompt('search-list', inquirerSearchList);
    const inq: IMovieResult = await inquirer
      .prompt([
        {
          type: 'search-list',
          message: 'Select a Movie or TV show',
          name: 'title',
          askAnswered: true,
          choices: medias.map((s: IMovieResult) => ({
            name: `${s.title}`,
            value: s.title,
          })),
        },
      ])
      .then(function (answers: { title: string }) {
        const mediaInfo: IMovieResult = _.find(
          medias,
          (o: IMovieResult) => o.title == answers.title
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
        console.log(match);

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
    let data: ISource | null = null;
    const spinner = this.getSpinner();

    const media =
      _movieInfo.type == TvType.MOVIE ? TvType.MOVIE : TvType.TVSERIES;
    spinner.text = `Searching for ${chalk.yellow(
      _movieInfo.title
    )} ${media} download link`;

    const episode = _episode as IMovieEpisode;
    spinner.start();

    const servers = await this.provider.fetchEpisodeServers(
      episode.id,
      _movieInfo.id
    );
    console.log(servers);
    //'1295437', 'tv/watch-see-online-29099'
    const srcs = await this.provider.fetchEpisodeSources(
      '1295437',
      'tv/watch-see-online-29099'
    );

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
      for (let i = 0; i < this.options.selectedEpisodes.length; i++) {
        const season = this.options.selectedEpisodes[i].season;
        const allSeasonEpisodes = _.filter(
          movieInfo.episodes,
          (o: IMovieEpisode) => o.season == season
        );

        if (allSeasonEpisodes.length == 0) {
          this.options.selectedEpisodes[i].notFound = true;
        }

        for (
          let j = 0;
          j < this.options.selectedEpisodes[i].episodes.length;
          j++
        ) {
          const element = _.find(
            allSeasonEpisodes,
            (o: IMovieEpisode) =>
              o.number == this.options.selectedEpisodes[i].episodes[j]
          );

          if (!element) {
            this.options.selectedEpisodes[i].episodes[j] = {
              number: this.options.selectedEpisodes[i].episodes[j],
              notFound: true,
            };
          } else {
            this.options.selectedEpisodes[i].episodes[j] = element;
          }
        }
      }
    }

    /*     if (!episode) {
      return null;
    }

    return episode; */
  }

  async handleDownload(movieInfo: IMovieInfo, quality: string) {
    const spinner = this.getSpinner();

    if (movieInfo.type == TvType.MOVIE) {
      spinner.text = `Searching for ${chalk.yellow(
        movieInfo.title
      )} Movie link`;
      spinner.start();

      const episodeLink = this.getLinks({ _movieInfo: movieInfo });
      let sources: ISource | null;

      spinner.start();

      sources = await this.getEpisodeSources({
        _movieInfo: movieInfo,
        _episode: this.options.selectedEpisodes,
      });

      spinner.stop();
    } else if (movieInfo.type == TvType.TVSERIES) {
      this.getLinks({ _movieInfo: movieInfo });

      for (let i = 0; i < this.options.selectedEpisodes.length; i++) {
        const season = this.options.selectedEpisodes[i];

        if (season.notFound) {
          continue;
        } else {
          for (let j = 0; j < season.episodes.length; j++) {
            const element = season.episodes[j];
            if (!element.notFound) {
              //we have an episode else proceed to down
              //fetch episode sources

              //console.log('here');

              const srcs = await this.getEpisodeSources({
                _movieInfo: movieInfo,
                _episode: element,
              });

              console.log(srcs);
              let choosen: IVideo;
              if (srcs != null) {
                choosen = this.getChoosenQuality(
                  srcs.sources,
                  parseInt(quality)
                );

                console.log(choosen, 'this');
              }
            } else {
              // console.log(element.notFound, element);
              //TODO to show

              continue;
            }
          }
        }

        let choosen;
        let sources: ISource | null;
      }
    }
  }

  async saveAsSeries(
    movieInfo: IMovieInfo,
    episode: number,
    choosen: IVideo,
    sources: ISource
  ) {
    createFolderIfNotFound(`./${movieInfo.title}`);
    console.log(
      `Now downloading: ${chalk.yellow(movieInfo.title)} Episode ${chalk.yellow(
        episode
      )} `
    );
    const dir = `'${path.join(movieInfo.title.toString())}'`;

    const cacheDir = path.join(homedir(), 'movie4u', this._provider, 'cache');
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
    movieInfo: IMovieInfo,
    episode: number,
    choosen: IVideo,
    sources: ISource
  ) {
    console.log(
      'Episode ' + chalk.yellow(episode) + ' link search complete \u2713'
    );

    console.log(`${chalk.yellow(movieInfo.title)} link search complete \u2713`);

    const name: string = movieInfo.title.toString();
    const regex = new RegExp(' ', 'g');
    const result = name.replace(regex, '-');

    console.log(`Now downloading: ${chalk.yellow(movieInfo.title)}`);
    await m3u8Download(choosen.url, {
      showProgress: true,
      filename: result,
      delCache: true,
      cacheDir: path.join(homedir(), 'movie4u', this._provider, 'cache'),
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
