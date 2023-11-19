import { readFileSync } from 'node:fs';
import { homedir, type } from 'node:os';
import path from 'node:path';
//import { IAnimeResult, ILink } from '../types/index.js';
//import { BaseProvider, IBaseProvider } from './BaseProvider.js';
import { BaseProvider, IGetEpisodeSources } from './BaseProviderV2.js';
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
    animeInfo: IAnimeInfo,
    quality: string,
    numberOfEpisodes: number
  ) {
    const spinner = this.getSpinner();

    for (let i = 0; i < this.options.episodes.length; i++) {
      let retrying = false;
      let qualities;
      let choosen;

      const episode = this.options.episodes[i];

      spinner.text = `Searching for ${chalk.yellow(
        animeInfo.title
      )} episode ${chalk.yellow(episode)} download link`;
      spinner.start();

      const { qualities: _ress } = await this.getPaheDownloadPage(
        animeInfo,
        episode,
        retrying
      );

      qualities = _ress;

      //////
      //Check for expired sessions, if expired re-run without using caches i'e fecthes
      if (qualities?.length == 0) {
        const sources = await this.retryGetEpisodeSources({
          animeInfo,
          episode,
        });

        retrying = true;
        //  numberOfEpisodes = numberOfEpisodes_;
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

      /*     await this.handleMediaDownload({
        media,
        type: 'TV',
        name: `E${episode}`,
        url: choosen.url,
      }); */
    }
  }

  private async downloadMovie(
    media: IAnimeInfo,
    quality: string,
    numberOfEpisodes: number
  ) {
    let retrying = false;
    let qualities;
    let choosen;

    const spinner = this.getSpinner();

    spinner.text = `Searching for ${chalk.yellow(
      media.title
    )} movie download link`;

    const { qualities: _ress } = await this.getPaheDownloadPage(
      media,
      '1',
      retrying
    );

    qualities = _ress;
    /* 
    //Check for expired sessions, if expired re-run without using caches i.e fecthes
    if (qualities?.length == 0) {
      const sources = await this.retryGetEpisodeSources(
  {animeInfo,, episode}
      );

      qualities = qualities_;
      media = anime_;
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
    spinner.stop();
    console.log(`${chalk.yellow(media.title)} link search complete \u2713`);

    choosen = this.getChoosenRes(parseInt(quality), qualities ?? []); */

    /*    await this.handleMediaDownload({
      media,
      url: choosen.url,
      type: 'Movie',
      name: media.title.toString(),
    }); */
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

  private async handleMediaDownload({
    animeInfo,
    url,
    type,
    name,
  }: {
    animeInfo: IAnimeInfo;
    url: string;
    type: MediaFormat;
    name: string;
  }) {
    let searchText = '';
    let nowDownloadinText = '';
    let fileName = '';
    if (type == 'TV') {
      searchText = `Searching for ${chalk.yellow(
        animeInfo.title
      )} episode ${chalk.yellow(name)} link`;
      nowDownloadinText = `Now downloading: ${chalk.yellow(
        animeInfo.title
      )} Episode ${chalk.yellow(name)} `;
      fileName = `E${name}`;
    } else if (type != MediaFormat.MOVIE) {
      searchText = `Searching for ${chalk.yellow(animeInfo.title)} movie link`;
      nowDownloadinText = `Now downloading: ${chalk.yellow(animeInfo.title)}`;
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

    const _url = res.headers.location;

    const spinner = this.getSpinner();
    spinner.text = searchText;

    spinner.start();

    try {
      spinner.stop();

      console.log(chalk.white(nowDownloadinText));

      const folder = type == 'TV' ? animeInfo.title : undefined;

      //  await this.download(_url, name, folder);
    } catch (error) {
      console.log(chalk.red('An error occured, please try again!'));
    }
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

  /*  async download(url: string, fileName: string, folder: string = './') {
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
    const dl = new DownloaderHelper(url, `${IO.sanitizeFolderName(folder)}`, {
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
  } */

  async getPaheDownloadPage(
    animeInfo: IAnimeResult,
    _episode: string,
    retrying: boolean
  ) {
    const linksPath = this.getLinksPath({ title: animeInfo.title.toString() });
    const linksString = readFileSync(linksPath).toString();
    const animeInfo_: IAnimeInfo = JSON.parse(linksString);

    const episode: IAnimeEpisode = _.find(
      animeInfo_.episodes,
      (o: IAnimeEpisode) => o.number == parseInt(_episode)
    );

    if (!episode) {
      return { qualities: [], episode: null };
    }

    let html = '';
    try {
      const res = await axios(
        `https://animepahe.ru/play/${episode.id.split('/')[0]}/${
          episode.id.split('/')[1]
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

  /*   async handleDownload({
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
      let retrying = false;
      let qualities;
      let numberOfEpisodes = animeInfo.episodes?.length ?? 0;

      const episode = this.options.episodes[i];

      if (type === MediaFormat.TV) {
        spinner.text = `Searching for ${chalk.yellow(
          animeInfo.title
        )} episode ${chalk.yellow(episode)} download link`;
        spinner.start();
      } else {
        spinner.text = `Searching for ${chalk.yellow(
          animeInfo.title
        )} movie download link`;
        spinner.start();
      }



      source = await this.getEpisodeSources({
        animeInfo,
        episode,
      });



      spinner.stop();

      if (episode > 1 && type == MediaFormat.MOVIE) {
        //for movies exit earlier
        break;
      }

      //Check for expired sessions, if expired re-run without using caches i'e fecthes
      if (source?.sources?.length == 0) {
         source = await this.retryGetEpisodeSources({
          animeInfo,
          episode,
        });
      
        retrying = true;
        numberOfEpisodes = animeInfo.episodes?.length ?? 0;
      }

      //if after retrying and episode is still greater than number of episode
      if (retrying || episode > numberOfEpisodes) {
        if (type == MediaFormat.MOVIE) {
          console.log(chalk.yellow('Could not find Movie, please try again!!'));
        } else {
          console.log(
            chalk.red(`\nCould not find episode ${episode}, please try again!`)
          );
        }
        break;
      }
      spinner.stop();

      if (type == MediaFormat.MOVIE) {
        console.log(chalk.yellow('Movie link search \u2713'));
      } else {
        console.log(
          'Episode ' + chalk.yellow(episode) + ' link search complete \u2713'
        );
      }

      //TODO USE PREVIOUS FORMAT i.e BASEV2
      choosen = this.getChoosenRes(parseInt(quality), qualities ?? []);
      console.log(choosen, 'nfvnhvnfvhh');
      await this.handleMediaDownload({
        animeInfo,
        type,
        name: `E${episode}`,
        url: choosen.url,
      });
    }
  } */
}
