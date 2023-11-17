// ESM
import {
  ANIME,
  MOVIES,
  StreamingServers,
  META,
  VidCloud,
} from '@consumet/extensions';
import { m3u8Download } from '@lzwme/m3u8-dl';
import path from 'path';
import { homedir } from 'os';
import fs from 'node:fs';

// <providerName> is the name of the provider you want to use. list of the proivders is below.
//animepahe
//x anime saturn
//flixhq for tv series works
//goku works too

function getServerEnum(server) {
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

(async () => {
  const provider = new MOVIES.FlixHQ();
  //console.log(provider);

  console.log(typeof getServerEnum('vidmoly'));
  //console.log(provider);

  /*  provider.search('See').then((data) => {
    console.log(data);
  }); */

  /*  provider.fetchMediaInfo('tv/watch-see-29099').then((data) => {
    console.log(data);
  }); */

  /*  provider.fetchEpisodeServers('1125905', 'tv/watch-see-29099').then((data) => {
    console.log(data);
  });
 */
  /*   provider
    .fetchEpisodeSources(
      '1125905',
      'tv/watch-see-29099',
      StreamingServers.UpCloud
    )
    .then((data) => {
      console.log(data);
    }); */

  /*   provider.fetchAnimeInfo('overlord-ple-ple-pleiades-3543').then((data) => {
    console.log(data);
  }); */

  /*   provider.fetchEpisodeSources('One-Piece-ITA-ep-100').then((data) => {
    console.log(data);
  });
 */
  /*   const c = 'animesaturn';
  await m3u8Download(
    'https://xex.stluserehtem.com/_v10/0b98209f3b916128acfbdaf51ff92e1762ae6e17062186078834c91751aae9f321b975965333dc5cb37235ebc7f558f2aab4aca94576ddbd754973016a329b919f6edb227ad7fde1b214ea39e4b2a880874bb373d7ddb661294b07968309283b329aefc1bdb080c4f1be357220e1f8ce3b108f55f4a2fc442e5eb13af62180607eaa5fa6fbb9f7c09aeff5cde4d15476/360/index.m3u8',
    {
      showProgress: true,
      filename: 'test',
      delCache: true,
      cacheDir: path.join(homedir(), 'movie4u', c, 'cachex'),
      headers: { Referer: 'https://rabbitstream.net/embed-4/VLFRnxoWc7mj?z=' },
    }
  ); */

  //process.exit(1);
})();
