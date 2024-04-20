import { ISource, IVideo } from '@consumet/extensions';
import _ from 'lodash';

const srcs: ISource = {
  headers: { Referer: 'https://rabbitstream.net/embed-4/pZw8zrAngkdW?z=' },
  sources: [
    {
      url: 'https://xex.stluserehtem.com/_v10/088a3808bf9a25265c182ab6776cabf9699878fa98b76c6bafe4eb0cd2d85a44c6c22ca4bd12b436eac646fc8d3ba0f77ae0054d7bdb4cb562eb159fb17889f9fef8578a94017569a5247abdc6fb20eec3a88df0c6667c940c43c76ce8d77335032a7d025a0d77d439c1bd7a8b5665690bc353d7d0573fd74f505deb320c8fe220ed80934c6146d10c717c8c955ad4c9/1080/index.m3u8',
      quality: '1080',
      isM3U8: true,
    },
    {
      url: 'https://xex.stluserehtem.com/_v10/088a3808bf9a25265c182ab6776cabf9699878fa98b76c6bafe4eb0cd2d85a44c6c22ca4bd12b436eac646fc8d3ba0f77ae0054d7bdb4cb562eb159fb17889f9fef8578a94017569a5247abdc6fb20eec3a88df0c6667c940c43c76ce8d77335032a7d025a0d77d439c1bd7a8b5665690bc353d7d0573fd74f505deb320c8fe220ed80934c6146d10c717c8c955ad4c9/720/index.m3u8',
      quality: '720',
      isM3U8: true,
    },
    {
      url: 'https://xex.stluserehtem.com/_v10/088a3808bf9a25265c182ab6776cabf9699878fa98b76c6bafe4eb0cd2d85a44c6c22ca4bd12b436eac646fc8d3ba0f77ae0054d7bdb4cb562eb159fb17889f9fef8578a94017569a5247abdc6fb20eec3a88df0c6667c940c43c76ce8d77335032a7d025a0d77d439c1bd7a8b5665690bc353d7d0573fd74f505deb320c8fe220ed80934c6146d10c717c8c955ad4c9/360/index.m3u8',
      quality: '360',
      isM3U8: true,
    },
  ],
  subtitles: [
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/bul-4.vtt',
      lang: 'Bulgarian - Bulgarian (Bulgaria)',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/hrv-5.vtt',
      lang: 'Croatian - Croatian (Croatia)',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/cze-6.vtt',
      lang: 'Czech - Czech (Czechia)',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/dan-7.vtt',
      lang: 'Danish - Danish',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/dut-8.vtt',
      lang: 'Dutch - Dutch',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/eng-2.vtt',
      lang: 'English - English',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/eng-3.vtt',
      lang: 'English - English [SDH]',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/est-9.vtt',
      lang: 'Estonian - Estonian (Estonia)',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/fin-11.vtt',
      lang: 'Finnish - Finnish',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/gre-12.vtt',
      lang: 'Greek - Greek (Modern)',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/hun-13.vtt',
      lang: 'Hungarian - Hungarian',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/ice-14.vtt',
      lang: 'Icelandic - Icelandic (Iceland)',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/lav-17.vtt',
      lang: 'Latvian - Latvian (Latvia)',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/lit-18.vtt',
      lang: 'Lithuanian - Lithuanian (Lithuania)',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/mac-19.vtt',
      lang: 'Macedonian - Macedonian (North Macedonia)',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/nor-20.vtt',
      lang: 'Norwegian - Norwegian',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/pol-21.vtt',
      lang: 'Polish - Polish',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/por-22.vtt',
      lang: 'Portuguese - Portuguese',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/por-23.vtt',
      lang: 'Portuguese - Portuguese Brazilian',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/rum-24.vtt',
      lang: 'Romanian - Romanian (Romania)',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/rus-25.vtt',
      lang: 'Russian - Russian',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/srp-26.vtt',
      lang: 'Serbian - Serbian (Latin, Serbia)',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/slo-27.vtt',
      lang: 'Slovak - Slovak (Slovakia)',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/slv-28.vtt',
      lang: 'Slovene - Slovenian (Slovenia)',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/spa-10.vtt',
      lang: 'Spanish - European Spanish',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/spa-15.vtt',
      lang: 'Spanish - Latin America Spanish',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/spa-16.vtt',
      lang: 'Spanish - Latin America Spanish [SDH]',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/swe-29.vtt',
      lang: 'Swedish - Swedish',
    },
    {
      url: 'https://cc.2cdns.com/4e/d1/4ed1aef33602c728207ec15435b95503/tur-30.vtt',
      lang: 'Turkish - Turkish',
    },
  ],
};

function getChoosenQuality(
  sources: IVideo[] | null,
  preferedRes: number
): { quality: string; url: string } {
  let choosen: any = {};
  const qualityRes = ['360', '480', '720', '800', '1080', '2160', 'auto'];

  const soredted = _.sortBy(sources, [
    function (o: IVideo) {
      return parseInt(o.quality ?? '');
    },
  ]);

  if (soredted != null) {
    for (let i = 0; i < soredted.length; i++) {
      const regexPattern = new RegExp(`(${qualityRes.join('|')})`);
      const match = soredted[i].quality?.match(regexPattern);
      console.log(match);

      if (match) {
        const el = parseInt(match[1] ?? '');
        if (el >= preferedRes) {
          choosen = soredted[i];
          break;
        }
        if (soredted.length == i + 1) {
          console.log('last');
          if (match[1] == 'auto') {
            choosen = soredted[i - 1];
          } else {
            choosen = soredted[i];
          }
        }
      }
    }
  }

  return choosen;
}

(() => {
  console.log('end');
  const choosen = getChoosenQuality(srcs.sources, 1440);
  //console.log(choosen);
})();
