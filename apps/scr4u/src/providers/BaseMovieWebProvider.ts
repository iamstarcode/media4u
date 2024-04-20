import { MovieWebBaseProviderType, OptionsType } from '../types';
import fs, { readFileSync } from 'node:fs';
import path from 'path';
import { CLI, IO, Util } from '@iamstarcode/4u-lib';
import chalk from 'chalk';
import ora, { Ora } from 'ora';

interface IMediResult {
  external_ids: any;
  id: number;
  type: 'tv' | 'movie' | 'show';
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
  type: 'tv' | 'movie' | 'show';
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
    //const url = 'http://localhost:8000';
    const url = 'https://tmdb-api-brown.vercel.app';
    this.options = options;
    this.searchPath = searchPath;
    this.query = query;
    this.providerName = providerName;
    this.API_BASE_URL = url;
    this.spinner = ora({ spinner: 'dots12' });
  }

  //Overrides
  async providerDownload({}: { provider: string; media: any }): Promise<void> {}
  async downloadStream({}: { provider: string; media: any }): Promise<void> {}
  async run() {
    const medias: IMediResult[] = await this.getMedia();

    let media: IMediResult = await CLI.inquireMedia(medias);

    if (!this.options.quality) {
      this.options.quality = await CLI.inquireQuality();
    } else {
      this.options.quality = this.options.quality;
    }

    const mediaInfo: IMediaInfo = await this.getMediaInfo(media);

    await this.handleDownload({ mediaInfo });

    if (mediaInfo.type == 'tv') {
    }
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

    if (mediaResult.type == 'tv' || mediaResult.type == 'show') {
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

  async handleDownload({ mediaInfo }: { mediaInfo: IMediaInfo }) {
    if (mediaInfo.type == 'movie') {
    } else {
      for (let i = 0; i < this.options.episodes.length; i++) {
        const season = this.options.episodes[i];
        if (season.season > mediaInfo.number_of_seasons!) {
          continue;
        } else {
          const searchText = `Searching for ${mediaInfo.title} Season ${season.season} episodes...`;
          this.getSpinner().text = searchText;
          this.getSpinner().start();

          const response = await fetch(
            `${this.API_BASE_URL}/tv/${mediaInfo.id}/season/${season.season}`
          );

          this.getSpinner().stop();

          const seasonData = await response.json();
          const allSeasonEpisodes: any[] = seasonData.episodes;

          for (let j = 0; j < season.episodes.length; j++) {
            const episode = season.episodes[j];

            if (allSeasonEpisodes.length < episode) {
              CLI.printInfo(
                `Season ${season.season} Episode ${chalk.yellow(
                  episode
                )} is not available or aired yet.`
              );
              process.exit(0);
            }

            const foundEpisode = allSeasonEpisodes.find(
              (item) => item.episode_number === episode
            );

            const media: any = {
              title: mediaInfo.title,
              releaseYear: +seasonData.air_date.substring(0, 4),
              tmdbId: foundEpisode.show_id,
              type: 'show',
              imdbId: mediaInfo.external_ids.imdb_id,
              episode: {
                number: foundEpisode.episode_number,
                title: foundEpisode.name!,
                tmdbId: foundEpisode.id,
              },
              season: {
                number: seasonData.season_number,
                tmdbId: seasonData.id,
              },
            };

            console.log(
              `Searching for ${chalk.yellow(media.title)} Season ${chalk.yellow(
                seasonData.season_number
              )} Episode ${chalk.yellow(
                foundEpisode.episode_number
              )} sources...`
            );
            await this.providerDownload({ provider: this.providerName, media });
          }
        }
      }
    }

    process.exit(0);
  }

  async downloadSubtitle(captions: any[], media: any) {
    if (this.options.subtitle) {
      const subtitle = captions.find(
        (subtitle: { language: any }) =>
          subtitle.language === this.options.subtitle
      );
      if (subtitle) {
        const { filename, saveDir } = IO.getFileAndFolderNameFromMedia(media);
        await IO.downloadSubtitle(subtitle.url, path.join(saveDir!, filename));
      } else {
        console.log(
          chalk.yellow(
            `Subtitle with language '${this.options.subtitle}' not dound`
          )
        );
      }
    } else {
      console.log('Please choose a subtile with -s option');
      process.exit(0);
    }
  }

  getSpinner() {
    return this.spinner;
  }
}
