import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { IMedia, ILink } from '../types/index.js';
import { BaseProvider, IBaseProvider } from './BaseProvider.js';
import * as cheerio from 'cheerio';

import {
  createFileIfNotFound,
  sanitizeFileName,
  sanitizeFolderName,
} from '../helpers/io/index.js';

import _ from 'lodash';

import chalk from 'chalk';
import { spawnSync } from 'node:child_process';

import axios from 'axios';

import tough from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

interface IEpisode {
  id: string;
  episode: string;
  session: string;
}

interface ILinks {
  title: string;
  type: string;
  links: [{ episode: string; session: string }];
}

export class AnimepaheProvider extends BaseProvider {
  constructor({
    baseUrl = 'https://animepahe.ru',
    provider = 'animepahe',
    searchPath = path.join(homedir(), 'anim4u', 'animepahe', 'Searches'),
    options,
    query,
  }: IBaseProvider) {
    super({ baseUrl, provider, options, searchPath, query });
  }

  override async run(): Promise<void> {
    let medias: IMedia[] = await this.getAnime(this.fetchAnime);
    let media: IMedia = await this.inquireMedia(medias);
    let quality;

    if (!this.options.quality) {
      quality = await this.inquireQuality();
    } else {
      quality = this.options.quality;
    }

    const { numberOfEpisodes, type } = await this.getLinks(
      media,
      this.fetchLinks
    );

    //
    //TV or Movie
    if (type == 'TV') {
      await this.downloadSeries(media, quality, numberOfEpisodes);
    } else if (type == 'Movie') {
      await this.downloadMovie(media, quality, numberOfEpisodes);
    }

    process.exit(0);
  }

  private fetchAnime = async (): Promise<IMedia[]> => {
    const searchText = `Searching ${chalk.yellow(this.query)} from ${chalk.hex(
      '#d5015b'
    )('Animepahe')} `;
    const spinner = await this.getSpinner(searchText);

    const res = await axios.get(
      `https://animepahe.ru/api?m=search&q=${encodeURIComponent(this.query)}`,
      {
        method: 'GET',
      }
    );

    const data = await res.data;

    const medias: IMedia[] = data.data;

    spinner.stop();
    console.log(chalk.green(`Anime search complete \u2713`));

    if (medias == undefined || medias.length < 0) {
      console.log(chalk.red(`No anime found \u2715 \n`));
      return [];
    } else {
      createFileIfNotFound(
        this.searchPath ?? '',
        `${sanitizeFileName(this.query)}.json`,
        JSON.stringify(medias)
      );
      return medias;
    }
  };

  private fetchLinks = async (
    media: IMedia,
    searchText: string
  ): Promise<{ type: string; numberOfEpisodes: number }> => {
    const mediaPath = path.join(
      this.searchPath ?? '',
      sanitizeFolderName(media?.title ?? '')
    );

    const spinner = await this.getSpinner(searchText);

    const res = await axios(
      `https://animepahe.com/api?m=release&sort=episode_asc&id=${media?.session}`,
      {
        method: 'GET',
      }
    );

    const { last_page, data } = await res.data;

    const type = media.type;

    let links: any = {};

    if (!data) {
      spinner.stop();
      console.log(chalk.yellow(`No episodes found, may not be aired yet!`));
      process.exit(1);
    } else {
      links.type = type;
      links.title = media.title;

      const allLinks: any[] = [];
      allLinks.push(...data);

      for (let i = 2; i <= last_page; i++) {
        const res = await axios(
          `https://animepahe.com/api?m=release&sort=episode_asc&id=${media?.session}&page=${i}`,
          {
            method: 'GET',
          }
        );

        const { data } = await res.data;
        allLinks.push(...data);
      }

      links.links = allLinks;

      spinner.stop();

      console.log(chalk.yellow(media.title) + ' info search complete \u2713');
      createFileIfNotFound(
        mediaPath ?? '',
        `links.json`,
        JSON.stringify(links)
      );

      return { type: links.type, numberOfEpisodes: allLinks.length };
    }
  };

  private async getPaheDownloadPage(
    media: IMedia,
    _episode: string,
    retrying: boolean
  ) {
    const linksPath = this.getLinksPath(media);
    const linksString = readFileSync(linksPath).toString();
    const links: ILink = JSON.parse(linksString);

    const episode: IEpisode = _.find(
      links.links,
      (o: IEpisode) => o.episode == _episode
    );

    if (!episode) {
      return { qualities: [], episode: null };
    }

    let html = '';
    try {
      const res = await axios(
        `https://animepahe.ru/play/${media.session}/${episode.session}`,
        {
          method: 'GET',
        }
      );

      html = await res.data;
    } catch (error) {
      if (this.options.debug) {
        console.log(error);
      }
    }

    const $ = cheerio.load(html);

    const qualities: { quality: string; url: string }[] = [];
    $('#pickDownload > a').each((i, el) => {
      let quality = $(el).text();
      const regex = /(\d+)p/;
      const match = quality.match(regex);
      quality = match ? match[1] : '720';
      const url = $(el).attr('href') ?? '';
      qualities.push({ quality, url });
    });

    return { qualities, episode };
  }

  private getDownloadURL(htmlData: string) {
    var regex = /<a href="(.+?)" .+?>Redirect me<\/a>/;
    const match = htmlData.match(regex);
    let downloadPageURl;

    if (match && match.length > 1) {
      downloadPageURl = match[1];
    }

    return downloadPageURl;
  }

  private getTokenAndDownloadURL(htmlData: string) {
    const head = htmlData.substring(htmlData.indexOf('var _0x') - 4);

    let cut = head.substring(0, head.indexOf('</script>'));

    cut = cut.replace('eval', 'console.log');

    let child = spawnSync('node', ['-e', cut]);

    const linkcut = child.stdout.toString();

    let regex = /value="(.+?)"/;

    let match = linkcut.match(regex);
    const token = match ? match[1] : null;

    regex = /<form action="([^"]+)"/;
    match = linkcut.match(regex);
    const downloadURL = match ? match[1] : null;

    return { token, downloadURL };
  }

  private async downloadSeries(
    media: IMedia,
    quality: string,
    numberOfEpisodes: number
  ) {
    for (let i = 0; i < this.options.episodes.length; i++) {
      let retrying = false;
      let qualities;
      let choosen;

      const episode = this.options.episodes[i];

      const spinner = await this.getSpinner(
        `Searching for ${chalk.yellow(media.title)} episode ${chalk.yellow(
          episode
        )} download link`
      );

      const { qualities: _ress } = await this.getPaheDownloadPage(
        media,
        episode,
        retrying
      );

      qualities = _ress;

      //////
      //Check for expired sessions, if expired re-run without using caches i'e fecthes
      if (qualities?.length == 0) {
        const { qualities_, media_, choosen_, numberOfEpisodes_ } =
          await this.retryFetch(media, quality, episode, retrying);

        qualities = qualities_;
        media = media_;
        choosen = choosen_;
        retrying = true;
        numberOfEpisodes = numberOfEpisodes_;
      }

      //
      //if after retried and episode is still greater than number of episode
      if (retrying && episode > numberOfEpisodes) {
        console.log(
          chalk.red(`\nCould not find episode ${episode}, please try again!`)
        );
        console.log(
          chalk.yellow(
            'Episode might not be available yet or an unknown error occured!'
          )
        );
        break;
      }

      spinner.stop();

      console.log(
        'Episode ' + chalk.yellow(episode) + ' link search complete \u2713'
      );

      choosen = this.getChoosenRes(parseInt(quality), qualities ?? []);

      await this.handleMediaDownload({
        media,
        type: 'TV',
        name: `E${episode}`,
        url: choosen.url,
      });
    }
  }

  private async downloadMovie(
    media: IMedia,
    quality: string,
    numberOfEpisodes: number
  ) {
    let retrying = false;
    let qualities;
    let choosen;

    const spinner = await this.getSpinner(
      `Searching for ${chalk.yellow(media.title)} movie download link`
    );

    const { qualities: _ress } = await this.getPaheDownloadPage(
      media,
      '1',
      retrying
    );

    qualities = _ress;

    //Check for expired sessions, if expired re-run without using caches i.e fecthes
    if (qualities?.length == 0) {
      const { qualities_, media_, choosen_, numberOfEpisodes_ } =
        await this.retryFetch(media, quality, '1', retrying);

      qualities = qualities_;
      media = media_;
      choosen = choosen_;
      retrying = true;
      numberOfEpisodes = numberOfEpisodes_;
    }

    //if after trying and does not exists
    if (retrying && numberOfEpisodes == 0) {
      console.log(chalk.red(`\nCould not find movie link, please try again!`));
      console.log(
        chalk.yellow(
          'Movie might not be available yet or an unknown error occured!'
        )
      );

      process.exit(0);
    }

    //
    spinner.stop();
    console.log(`${chalk.yellow(media.title)} link search complete \u2713`);

    choosen = this.getChoosenRes(parseInt(quality), qualities ?? []);

    await this.handleMediaDownload({
      media,
      url: choosen.url,
      type: 'Movie',
      name: media.title ?? '',
    });
  }

  private async retryFetch(
    _media: IMedia,
    _quality: string,
    _episode: any,
    _retrying: boolean
  ) {
    const medias: IMedia[] = await this.fetchAnime();
    const media_ = _.find(medias, (o: IMedia) => o.title == _media.title);

    const { numberOfEpisodes: numberOfEpisodes_ } = await this.fetchLinks(
      media_,
      `Retrying search for '${media_?.title}' ${
        _media.type == 'TV' ? 'episodes' : ''
      }`
    );

    const { qualities: qualities_ } = await this.getPaheDownloadPage(
      media_,
      _episode,
      _retrying
    );

    const choosen_ = this.getChoosenRes(parseInt(_quality), qualities_);

    return { media_, choosen_, qualities_, numberOfEpisodes_ };
  }

  private async handleMediaDownload({
    media,
    url,
    type,
    name,
  }: {
    media: IMedia;
    url: string;
    type: 'TV' | 'Movie';
    name: string;
  }) {
    let searchText = '';
    let nowDownloadinText = '';
    let fileName = '';
    if (type == 'TV') {
      searchText = `Searching for ${chalk.yellow(
        media.title
      )} episode ${chalk.yellow(name)} link`;
      nowDownloadinText = `Now downloading: ${chalk.yellow(
        media.title
      )} Episode ${chalk.yellow(name)} `;
      fileName = `E${name}`;
    } else if (type == 'Movie') {
      searchText = `Searching for ${chalk.yellow(media.title)} movie link`;
      nowDownloadinText = `Now downloading: ${chalk.yellow(media.title)}`;
      fileName = name;
    }

    const jar = new tough.CookieJar();

    const client = wrapper(axios.create({ jar }));

    const { data: firstData } = await client.get(url);

    const downloadPageURl = this.getDownloadURL(firstData);

    const { data: secondData } = await client.get(downloadPageURl ?? '');

    const { token, downloadURL } = this.getTokenAndDownloadURL(secondData);

    const res = await client.post(
      downloadURL ?? '',
      {
        _token: token,
      },
      {
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: (status) => status === 302,
        headers: {
          Referer: 'https://kwik.cx/',
        },
      }
    );

    //

    const _url = res.headers.location;

    const spinner = await this.getSpinner(searchText);

    try {
      spinner.stop();

      console.log(chalk.white(nowDownloadinText));

      const folder = type == 'TV' ? media.title : undefined;

      await this.download(_url, name, folder);
    } catch (error) {
      console.log(chalk.red('An error occured, please try again!'));
    }
  }
}
