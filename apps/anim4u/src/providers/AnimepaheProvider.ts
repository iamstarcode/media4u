import { readFileSync } from 'node:fs';
import { homedir, type } from 'node:os';
import path from 'node:path';
//import { IAnimeResult, ILink } from '../types/index.js';
//import { BaseProvider, IBaseProvider } from './BaseProvider.js';
import {
  BaseProvider,
  IGetEpisodeSources,
  IHandleMediaDownload,
} from './BaseProviderV2.js';
import * as cheerio from 'cheerio';

import { IO, CLI } from '@iamstarcode/4u-lib';

import _ from 'lodash';

import chalk from 'chalk';
import { spawnSync } from 'node:child_process';

import axios from 'axios';

import tough from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import {
  ANIME,
  IAnimeEpisode,
  IAnimeInfo,
  IAnimeResult,
  ISource,
  ITitle,
  IVideo,
  MediaFormat,
  TvType,
} from '@consumet/extensions';
import { ILink, IProvider } from '../types/index.js';
import { DownloaderHelper } from 'node-downloader-helper';
import { humanFileSize } from '../utils/human-file-szie.js';

import cliProgress from 'cli-progress';

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
  constructor({ options, query }: IProvider) {
    super({
      options,
      query,
      provider: new ANIME.AnimePahe(),
      searchPath: path.join(homedir(), 'anim4u', 'animepahe', 'Searches'),
      _provider: 'animepahe',
    });
  }

  async getEpisodeSources({
    animeInfo,
    episode,
  }: IGetEpisodeSources): Promise<ISource | null> {
    const linksPath = this.getLinksPath({ title: animeInfo.title.toString() });
    const linksString = readFileSync(linksPath).toString();
    const animeInfo_: IAnimeInfo = JSON.parse(linksString);

    const _episode: IAnimeEpisode = _.find(
      animeInfo_.episodes,
      (o: IAnimeEpisode) => o.number == episode
    );

    if (!episode) {
      return null;
    }

    let data: ISource = { sources: [] };
    let html = '';
    try {
      const res = await axios(
        `https://animepahe.ru/play/${_episode.id.split('/')[0]}/${
          _episode.id.split('/')[1]
        }`,
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

    const qualities: IVideo[] = [];
    $('#pickDownload > a').each((i, el) => {
      let quality = $(el).text();
      const regex = /(\d+)p/;
      const match = quality.match(regex);
      quality = match ? match[1] : '720';
      const url = $(el).attr('href') ?? '';
      qualities.push({ quality, url });
    });

    data.sources = qualities;

    return data;
  }

  async handleMediaDownload({
    animeInfo,
    choosen,
    episode,
    source,
    type,
  }: IHandleMediaDownload) {
    let searchText = '';
    let nowDownloadinText = '';
    let fileName = '';
    const spinner = this.getSpinner();
    if (type == MediaFormat.TV) {
      searchText = `Searching for ${chalk.yellow(
        animeInfo.title
      )} episode ${chalk.yellow(episode)} link`;
      nowDownloadinText = `Now downloading: ${chalk.yellow(
        animeInfo.title
      )} Episode ${chalk.yellow(episode)} `;
      fileName = `E${episode}`;
    } else if (type == MediaFormat.MOVIE) {
      searchText = `Searching for ${chalk.yellow(animeInfo.title)} movie link`;
      nowDownloadinText = `Now downloading: ${chalk.yellow(animeInfo.title)}`;
      fileName = IO.sanitizeFileName(animeInfo.title.toString());
    }

    spinner.text = searchText;
    spinner.start();

    const jar = new tough.CookieJar();

    const client = wrapper(axios.create({ jar }));

    const { data: firstData } = await client.get(choosen.url);

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

    const _url = res.headers.location;

    try {
      spinner.stop();

      console.log(chalk.white(nowDownloadinText));

      const folder = type == 'TV' ? animeInfo.title.toString() : undefined;

      await this.download(_url, fileName, folder);
    } catch (error) {
      console.log(chalk.red('An error occured, please try again!'));
    }
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

  async retryGetEpisodeSources({
    animeInfo,
    episode,
  }: IGetEpisodeSources): Promise<ISource | null> {
    //silenlty refresh cache from AnimeResult too
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

    IO.createFileIfNotFound(
      this.searchPath,
      `${this.query}.json`,
      JSON.stringify(medias)
    );

    const anime_ = _.find(
      medias,
      (o: IAnimeResult) => o.title == animeInfo.title
    );

    const _animeInfo = await this.fetchAnimeInfo(anime_);

    const sources = await this.getEpisodeSources({
      animeInfo: _animeInfo,
      episode,
    });

    return sources;
  }

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

    IO.createFolderIfNotFound(`${IO.sanitizeFolderName(folder)}`);

    const dl = new DownloaderHelper(
      url,
      folder ? folder : `${IO.sanitizeFolderName(folder)}`,
      {
        fileName: { name: fileName },
        override: true,
      }
    );

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
}
