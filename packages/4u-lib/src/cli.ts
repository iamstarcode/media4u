import chalk from 'chalk';
import autocomplete from 'inquirer-autocomplete-standalone';
import select from '@inquirer/select';

export const providerSeperated = (value: string) => {
  return value.split(':');
};

export const pasrseResolution = (value: string) => {
  return parseInt(value);
};

export function collect(value: any, previous: any[]) {
  return previous.concat([value]);
}

export const checkSeasonalEpisodesFormat = (episodes: string[]) => {
  for (let i = 0; i < episodes.length; i++) {
    const episode = episodes[i];
    const regex = /^(s|S)([1-9]\d*):(\d+(-\d+)?)(,(\d+(-\d+)?))*$/;

    if (!regex.test(episode)) {
      console.log(chalk.red('Episode is not written correctly.'));
      console.log(chalk.redBright.bgWhite(episode));
      console.log(
        chalk.yellow('s[season_number]:[episode_number-episode_number][...]')
      );
      console.log(chalk.yellow('Example s1:1-5,7,8-9'));
      console.log(chalk.yellow('Season one episode 1 to 5,7 and 8 to 9'));

      process.exit(1);
    }
  }
};

function checkEpisodesFormat(episodesStr: string) {
  const regex = /^(?!0\d)(\d+(-\d+)?)(,\d+(-\d+)?)*$/;

  if (!regex.test(episodesStr)) {
    printInfo(
      `Episode is not written correctly: ${chalk.redBright.bgWhite(
        episodesStr
      )}`
    );
    printInfo(
      'It should be in this format:  [episode_number,[episode_number-episode_number] '
    );
    printInfo('Example: 1-3,5,8-10 == Episode: 1 to 3, 5 and 8 to 10');

    process.exit(1);
  }
}

export function parseEpisodes(episodesStr: string): number[] {
  checkEpisodesFormat(episodesStr);
  const episodes: Set<number> = new Set();

  // Split the input string by commas
  const segments: string[] = episodesStr.split(',');

  segments.forEach((segment) => {
    if (segment.includes('-')) {
      // If segment is a range
      const [start, end] = segment.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        episodes.add(i);
      }
    } else {
      // If segment is a single episode
      episodes.add(Number(segment));
    }
  });

  // Convert Set to array
  return Array.from(episodes);
}

function parseRanges(input: string): number[] {
  const ranges = input.split(',');
  const numbers: Set<number> = new Set();

  ranges.forEach((range) => {
    const [start, end] = range.split('-').map(Number);
    if (!isNaN(start)) {
      if (!isNaN(end)) {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        for (let i = min; i <= max; i++) {
          numbers.add(i);
        }
      } else {
        numbers.add(start);
      }
    }
  });

  return Array.from(numbers);
}

export const parseSeasonalEpisodes = (collectedEpisodes: string[]) => {
  checkSeasonalEpisodesFormat(collectedEpisodes);

  let eps: any[] = [];
  for (let i = 0; i < collectedEpisodes.length; i++) {
    const ep = collectedEpisodes[i]; ///'s9:1-5,7,8-9
    const [sn, ranges] = ep.split(':');
    const season = sn.substring(1);
    const episodes = parseRanges(ranges);

    eps.push({ season: parseInt(season), episodes });
  }

  const resultMap: Map<number, Set<number>> = new Map();

  for (const group of eps) {
    const { season, episodes } = group;

    if (!resultMap.has(season)) {
      resultMap.set(season, new Set(episodes));
    } else {
      const mergedEpisodes = new Set([...resultMap.get(season)!, ...episodes]);
      resultMap.set(season, mergedEpisodes);
    }
  }

  const mergedArray = Array.from(resultMap, ([season, episodes]) => ({
    season,
    episodes: Array.from(episodes),
  }));

  mergedArray.sort((a, b) => a.season - b.season);

  return mergedArray;
};

export const handleIfNewVersion = async (version: string, pkgName: string) => {
  const response = await fetch(`https://registry.npmjs.org/${pkgName}`);
  const data = await response.json();
  const latestVersion = data['dist-tags'].latest;

  if (latestVersion !== version) {
    console.log('New version available: ', chalk.green(latestVersion));
    console.log('Version installed: ', chalk.red(version));
  }
};

export const inquireMedia = async (medias: any[]) => {
  const answer: any = await autocomplete({
    message: 'Select a Movie or TV show',

    source: async (input) => {
      return medias.map(
        (media: { title: string; type: string; release_date: string }) => {
          const { type, release_date, title } = media;
          let name = title;
          if (type) {
            name += ` [${type.toLocaleUpperCase()}]`;
          }
          if (release_date) {
            name += ` [${release_date}]`;
          }
          return {
            value: media,
            name,
          };
        }
      );
    },
  });

  const mediaInfo = medias.find((o: { id: any }) => o.id === answer.id);

  //const mediaInfo = _.find(medias, (o: { id: any }) => o.id == answer.id);

  return mediaInfo;
};

export async function inquireQuality() {
  const qualityRes = [
    { value: '360' },
    { value: '480' },
    { value: '720' },
    { value: '800' },
    { value: '1080' },
    { value: '2160' },
  ];
  const answer = await select({
    message: 'Select prefered quality',
    choices: qualityRes,
  });

  return parseInt(answer);
}

export const printInfo = (message: string) => {
  console.log(`${chalk.hex('08458f')('[INFO]')} ${message}`);
};

export const printWarn = (message: string) => {
  console.log(`${chalk.yellow('[WARNING]')} ${message}`);
};

export const printError = (message: string) => {
  console.log(`${chalk.red('[ERROR]')} ${message}`);
};
