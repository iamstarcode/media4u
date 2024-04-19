import chalk from 'chalk';
import _ from 'lodash';
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

export const checkFormat = (episodes: any) => {
  for (let i = 0; i < episodes.selectedEpisodes; i++) {
    const episode = episodes[i];
    const regexPattern =
      /^s[1-9][0-9]*:([1-9][0-9]*)-?([1-9][0-9]*)?(?:,([1-9][0-9]*)-?([1-9][0-9]*)?)*$/;

    if (!regexPattern.test(episode)) {
      console.log(chalk.red('Episode is not written correctly.'));
      console.log(chalk.redBright.bgWhite(episodes));
      console.log(
        chalk.yellow('s[season_number]:[episode_number-episode_number][...]')
      );
      console.log(chalk.yellow('Example s1:1-5,7,8-9'));
      console.log(chalk.yellow('Season one episode 1 to 5,7 and 8 to 9'));

      process.exit(1);
    }
  }
};

export const handleEpisodes = (selectedEpisodes: string[]) => {
  checkFormat(selectedEpisodes);

  let eps: any[] = [];
  for (let i = 0; i < selectedEpisodes.length; i++) {
    const ep = selectedEpisodes[i]; ///'s9:1-5,7,8-9
    const season = ep.substring(1, ep.indexOf(':'));
    const streamedEpisodes = episodesSeperated(
      ep.substring(ep.indexOf(':') + 1)
    );
    eps.push({ season: parseInt(season), episodes: streamedEpisodes });
  }

  const groupedBySeason = _.groupBy(eps, 'season');

  const mergedData = _.map(groupedBySeason, (group: []) =>
    _.mergeWith(...group, (objValue: any, srcValue: any) => {
      if (_.isArray(objValue)) {
        return _.sortBy(_.union(objValue, srcValue));
      }
    })
  );

  return mergedData;
};

export const episodesSeperated = (value: string) => {
  const season = value.split;
  const allEpisodes = [];
  const ranges = value.split(',');

  for (let i = 0; i < ranges.length; i++) {
    if (ranges[i].includes('-')) {
      //proccess for splitting
      const upperAndLower = ranges[i].split('-');
      const lower = parseInt(upperAndLower[0]);
      const upper = parseInt(upperAndLower[1]);
      if (!Number.isNaN(lower) || !Number.isNaN(upper)) {
        //clean for range
        const max = Math.max(upper, lower);
        const min = Math.min(upper, lower);

        for (let j = min; j <= max; j++) {
          const element = j;
          allEpisodes.push(element);
        }
      }
    } else {
      const num = parseInt(ranges[i]);
      if (!Number.isNaN(num)) {
        allEpisodes.push(num);
      }
    }
  }
  const unique = _.uniq(allEpisodes);

  return _.sortBy(unique, (o: number) => o);
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
          let name = '';
          if (type) {
            name += `${title} [${type.toLocaleUpperCase()}]`;
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

  const mediaInfo = _.find(medias, (o: { id: any }) => o.id == answer.id);

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
  console.log(`${chalk.blue('[INFO]')} ${message}`);
};
export const printWarn = (message: string) => {
  console.log(`${chalk.yellow('[WARNING]')} ${message}`);
};
export const printError = (message: string) => {
  console.log(`${chalk.red('[ERROR]')} ${message}`);
  process.exit(1);
};
