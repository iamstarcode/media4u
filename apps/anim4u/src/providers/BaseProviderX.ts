import chalk from 'chalk';
import { DownloaderHelper } from 'node-downloader-helper';

import { IO } from '@iamstarcode/4u-lib';

import { IAnimeResult, OptionsType, ILink } from '../types/index.js';
import cliProgress from 'cli-progress';
import { humanFileSize } from '../utils/human-file-szie.js';
import path from 'path';

import fs, { readFileSync } from 'node:fs';

import _ from 'lodash';
import ora from 'ora';
import Gogoanime from '@consumet/extensions/dist/providers/anime/gogoanime.js';
import { IAnimeInfo } from '@consumet/extensions';

export interface IBaseProvider {
  baseUrl?: string;
  provider?: string | Gogoanime;
  searchPath?: string;
  searchURL?: string | null;
  options: OptionsType;
  query: string;
}

export type IBase = {
  run: () => void;
};

export abstract class BaseProvider implements IBase {
  baseUrl;
  searchURL;
  provider;
  searchPath;
  options: OptionsType;
  query;

  constructor({
    baseUrl,
    provider,
    searchPath,
    options,
    query,
    searchURL = null,
  }: IBaseProvider & { options: OptionsType }) {
    this.baseUrl = baseUrl;
    this.provider = provider;
    this.searchPath = searchPath;
    this.options = options;
    this.query = query;
    this.searchURL = searchURL;
  }

  run() {}

  async download(url: string, fileName: string, folder: string = './') {
    const ratio = process.stdout.columns <= 56 ? 0.2 : 0.25;
    const bar = new cliProgress.SingleBar(
      {
        format:
          '{percentage}% [' +
          chalk.green(`{bar}`) +
          ']' +
          chalk.blue(' {downloaded}/{size}') +
          chalk.yellow(' {duration_formatted} ') +
          chalk.hex('#28B5C0')('{speed}/s'),
        hideCursor: true,
        barsize: 20,
        forceRedraw: true,
      },
      cliProgress.Presets.legacy
    );

    IO.createDirIfNotFound(`${IO.sanitizeDirName(folder)}`);
    const dl = new DownloaderHelper(url, `${IO.sanitizeDirName(folder)}`, {
      fileName: { name: fileName },
      override: true,
    });

    const size = await dl.getTotalSize();

    bar.start(100);

    dl.on('error', (err) => {
      bar.stop();
      console.log('Download Failed', err);
    });

    dl.on('progress', ({ speed, progress, downloaded }) => {
      bar.update(Math.ceil(progress), {
        speed: humanFileSize(speed),
        downloaded: humanFileSize(downloaded),
        size: humanFileSize(size.total ?? 0),
      });
    });

    dl.on('end', () => {
      bar.stop();
      console.log(chalk.greenBright.bold(`Download complete \u2713 `)); //
    });

    await dl.start().catch((err) => {
      console.error(err);
      bar.stop();
    });
  }

  getLinksPath(mediaInfo: IAnimeResult) {
    const linksPath = path.join(
      this.searchPath ?? '',
      IO.sanitizeFileName(mediaInfo?.title ?? ''),
      `links.json`
    );

    return linksPath;
  }

  getChoosenRes(
    preferedRes: number,
    qualities: { quality: string; url: string }[]
  ): { quality: string; url: string } {
    let choosen: any = {};

    for (let i = 0; i < qualities.length; i++) {
      const el = parseInt(qualities[i].quality);
      if (el >= preferedRes) {
        choosen = qualities[i];
        break;
      }
      if (qualities.length == i + 1) {
        choosen = qualities[i];
      }
    }

    return choosen;
  }

  async getAnimeInfo(
    media: IAnimeResult,
    callback: (_media: IAnimeResult, searchText: string) => Promise<IAnimeInfo>
  ): Promise<{ type?: string; numberOfEpisodes: number }> {
    const mediaPath = path.join(
      this.searchPath ?? '',
      IO.sanitizeDirName(media?.title ?? '')
    );

    const linksPath = path.join(
      this.searchPath ?? '',
      IO.sanitizeDirName(media?.title ?? ''),
      `links.json`
    );

    let numberOfEpisodes_;
    let type_;

    if (this.options.force) {
      const { numberOfEpisodes, type } = await callback(
        media,
        `Searching ${chalk.yellow(media?.title)} info`
      );

      numberOfEpisodes_ = numberOfEpisodes;
      type_ = type;
    } else {
      if (!fs.existsSync(path.join(mediaPath, 'links.json'))) {
        const { numberOfEpisodes, type } = await callback(
          media,
          `Searching ${chalk.yellow(media?.title)} info`
        );

        numberOfEpisodes_ = numberOfEpisodes;
        type_ = type;
      } else {
        const linksString = readFileSync(linksPath).toString();
        const media: ILink = JSON.parse(linksString);
        const numberOfEpisodes = media.links.length;
        const type = media.type;

        numberOfEpisodes_ = numberOfEpisodes;
        type_ = type;
      }
    }

    return { type: type_, numberOfEpisodes: numberOfEpisodes_ };
  }

  async getAnime(
    callback: (_query: string) => Promise<IAnimeResult[]>
  ): Promise<IAnimeResult[]> {
    const queryFile = path.join(
      this.searchPath ?? '',
      `${IO.sanitizeFileName(this.query)}.json`
    );

    if (this.options.force) {
      return await callback(this.query);
    } else {
      if (!fs.existsSync(queryFile)) {
        console.log('does not exits');
        return await callback(this.query);
      } else {
        const seasonsString = readFileSync(queryFile).toString();
        return JSON.parse(seasonsString);
      }
    }
  }

  async getSpinner(text: string) {
    const spinner = ora({ text, spinner: 'dots12' });
    spinner.start();
    return spinner;
  }
}
