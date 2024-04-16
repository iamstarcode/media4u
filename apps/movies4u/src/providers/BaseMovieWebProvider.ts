import { MovieWebBaseProviderType, OptionsType } from '../types';
import fs, { readFileSync } from 'node:fs';
import path from 'path';
import Spinner from '../utils/spinner';
import { IMovieResult } from '@consumet/extensions';
import { IO } from '@iamstarcode/4u-lib';
import chalk from 'chalk';

export class BaseMovieWebProvider {
  options: OptionsType;
  searchPath: string;
  query: string;
  providerName;

  API_BASE_URL: string;
  constructor({
    options,
    searchPath,
    query,
    providerName,
  }: MovieWebBaseProviderType) {
    this.options = options;
    this.searchPath = searchPath;
    this.query = query;
    this.providerName = providerName;
    this.API_BASE_URL =
      process.env.NODE_ENV == 'development'
        ? 'localhost:8000'
        : 'https://tmdb-api-brown.vercel.app/';
  }

  async getMedia(): Promise<{ id: number; name: string }[]> {
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

  async fetchMedia(): Promise<{ id: number; name: string }[]> {
    const spinner = Spinner();
    let providerColor;

    if (this.providerName == 'VidSrcTo') {
      providerColor = chalk.hex('#79c142')(this.providerName);
    }

    const searchText = `Searching ${chalk.yellow(
      this.query
    )} from ${providerColor} `;

    spinner.text = searchText;
    spinner.start();
    const medias: IMovieResult[] = [];

    let page = 1;
    let hasNextPage: boolean;

    const response = await fetch(
      `${this.API_BASE_URL}/search?query${this.query}`
    );
    /*     do {
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
 */
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

  async run() {}
}
