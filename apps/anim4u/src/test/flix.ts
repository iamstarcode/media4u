import { ANIME, MOVIES } from '@consumet/extensions';

(async () => {
  const flix = new MOVIES.FlixHQ();
  const p = new ANIME.AnimePahe();
  p.search('naruto').then((data) => {
    console.log(data);
  });

  /*  flix.search('See').then((data) => {
    console.log(data);
  }); */

  flix.fetchMediaInfo('tv/watch-see-29099').then((data) => {
    console.log(data);
  });

  flix
    .fetchEpisodeSources(
      '1125904',
      'tv/watch-see-29099'
      // StreamingServers.UpCloud
    )
    .then((data) => {
      console.log(data);
    });

  /*   await m3u8Download(
    'https://xex.stluserehtem.com/_v10/0b98209f3b916128acfbdaf51ff92e1762ae6e17062186078834c91751aae9f321b975965333dc5cb37235ebc7f558f2aab4aca94576ddbd754973016a329b919f6edb227ad7fde1b214ea39e4b2a880874bb373d7ddb661294b07968309283b329aefc1bdb080c4f1be357220e1f8ce3b108f55f4a2fc442e5eb13af62180607eaa5fa6fbb9f7c09aeff5cde4d15476/360/index.m3u8',
    {
      showProgress: true,
      filename: 'test',
      delCache: true,
      cacheDir: path.join(homedir(), 'anim4u', 'cachex'),
      headers: { Referer: 'https://rabbitstream.net/embed-4/VLFRnxoWc7mj?z=' },
    }
  ); */

  //process.exit(1);
  //
})();
