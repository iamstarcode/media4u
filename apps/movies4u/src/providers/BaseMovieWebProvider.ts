import { MovieWebBaseProviderType, OptionsType } from '../types';
import fs, { readFileSync } from 'node:fs';
import path from 'path';
import Spinner from '../utils/spinner';
import { IMovieResult } from '@consumet/extensions';
import { CLI, IO } from '@iamstarcode/4u-lib';
import chalk from 'chalk';
import ora, { Ora } from 'ora';

interface MediResult {
  id: string;
  media_type: 'tv' | 'movie';
  name: string;
  first_air_date: string;
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

  async getMedia(): Promise<MediResult[]> {
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

  async fetchMedia(): Promise<MediResult[]> {
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
    const medias: MediResult[] = await this.getMedia();

    let media: any = await CLI.inquireMedia(medias);
  }

  getSpinner() {
    return this.spinner;
  }
}
