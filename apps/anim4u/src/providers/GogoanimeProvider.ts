import {
  ANIME,
  IAnimeInfo,
  IAnimeResult,
  MediaFormat,
  MediaStatus,
} from '@consumet/extensions';
import _ from 'lodash';

import { BaseProvider } from './BaseProvider.js';
import path from 'path';

import { load } from 'cheerio';
import { IO } from '@iamstarcode/4u-lib';
import chalk from 'chalk';
import { IBaseProvider } from './BaseProviderX.js';
import { appPath } from '../config/constants.js';

export class GogoanimeProvider extends BaseProvider {
  constructor({ options, query }: IBaseProvider) {
    super({
      options,
      query,
      provider: new ANIME.Gogoanime(),
      searchPath: path.join(appPath, 'gogoanime', 'Searches'),
      providerName: 'gogoanime',
    });
  }

  async fetchAnimeInfo(anime: IAnimeResult): Promise<any> {
    const spinner = this.getSpinner();
    const mediaPath = path.join(
      this.searchPath,
      IO.sanitizeDirName(anime.title.toString())
    );

    spinner.text = `Searching ${chalk.yellow(anime.title.toString())} info`;
    spinner.start();

    const baseUrl = 'https://gogoanime3.co';
    const ajaxUrl = 'https://ajax.gogocdn.net/ajax';

    const res = await fetch(anime.url!);
    const data = await res.text();

    const animeInfo: IAnimeInfo = {
      id: '',
      title: '',
      url: '',
      genres: [],
      totalEpisodes: 0,
    };

    const $ = load(data);

    animeInfo.title = $(
      'section.content_left > div.main_body > div:nth-child(2) > div.anime_info_body_bg > h1'
    )
      .text()
      .trim();

    animeInfo.url = anime.url;
    animeInfo.image = $('div.anime_info_body_bg > img').attr('src');
    animeInfo.releaseDate = $('div.anime_info_body_bg > p:nth-child(8)')
      .text()
      .trim()
      .split('Released: ')[1];

    animeInfo.description = $('div.anime_info_body_bg > div:nth-child(6)')
      .text()
      .trim()
      .replace('Plot Summary: ', '');

    animeInfo.hasDub = animeInfo.title.toLowerCase().includes('dub')
      ? true
      : false;

    animeInfo.type = $('div.anime_info_body_bg > p:nth-child(4) > a')
      .text()
      .trim()
      .toUpperCase() as MediaFormat;

    animeInfo.status = MediaStatus.UNKNOWN;

    switch ($('div.anime_info_body_bg > p:nth-child(9) > a').text().trim()) {
      case 'Ongoing':
        animeInfo.status = MediaStatus.ONGOING;
        break;
      case 'Completed':
        animeInfo.status = MediaStatus.COMPLETED;
        break;
      case 'Upcoming':
        animeInfo.status = MediaStatus.NOT_YET_AIRED;
        break;
      default:
        animeInfo.status = MediaStatus.UNKNOWN;
        break;
    }
    animeInfo.otherName = $('div.anime_info_body_bg > p:nth-child(10)')
      .text()
      .replace('Other name: ', '')
      .replace(/;/g, ',');

    $('div.anime_info_body_bg > p:nth-child(7) > a').each((i, el) => {
      animeInfo.genres?.push($(el).attr('title')!.toString());
    });

    const ep_start = $('#episode_page > li').first().find('a').attr('ep_start');
    const ep_end = $('#episode_page > li').last().find('a').attr('ep_end');
    const movie_id = $('#movie_id').attr('value');
    const alias = $('#alias_anime').attr('value');

    const html = await fetch(
      `${ajaxUrl}/load-list-episode?ep_start=${ep_start}&ep_end=${ep_end}&id=${movie_id}&default_ep=${0}&alias=${alias}`
    );
    const htmldata = await html.text();
    const $$ = load(htmldata);

    animeInfo.episodes = [];
    $$('#episode_related > li').each((i, el) => {
      animeInfo.episodes?.push({
        id: $(el).find('a').attr('href')?.split('/')[1]!,
        number: parseFloat($(el).find(`div.name`).text().replace('EP ', '')),
        url: `${baseUrl}/${$(el).find(`a`).attr('href')?.trim()}`,
      });
    });
    animeInfo.episodes = animeInfo.episodes.reverse();

    animeInfo.totalEpisodes = parseInt(ep_end ?? '0');

    if (!animeInfo) {
      console.log(chalk.yellow(`No episodes found, may not be aired yet!`));
      process.exit(1);
    } else {
      //console.log(chalk.yellow(anime.title) + ' info search complete \u2713');
      //IO.createDirIfNotFound(this.searchPath);

      IO.createFileIfNotFound(
        mediaPath,
        `links.json`,
        JSON.stringify(animeInfo)
      );
    }

    return animeInfo;
  }
}
