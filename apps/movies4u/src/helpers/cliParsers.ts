import chalk from 'chalk';
import _ from 'lodash';
const commaSeparatedList = (value: string, dummyPrevious: any) => {
  return value.split(',');
};

export const providerSeperated = (value: string) => {
  return value.split(':');
};

export const pasrseResolution = (value: string) => {
  return parseInt(value);
};

export const seasonSeperated = (value: string) => {
  //s[1-9]:[0-9]+-[0-9]+
  //s[1-9][0-9]*
  //s[1-9][0-9]*:(?:[1-9][0-9]*-[1-9][0-9]*)(?:,[1-9][0-9]*-[1-9][0-9]*)*
  //s[1-9][0-9]*:(?:[1-9][0-9]*(-[1-9][0-9]*)?(?:,[1-9][0-9]*(-[1-9][0-9]*)?)*)?
  /*
write a regex that matches a string that starts with letter s, folllowed by a number greater
than 0 followed by a colon
then followed by a range of number with upper and lower bounds
they can be a single lower bound without and upper bound
and the lower and upper bound must be greater than 0
now in this range the lower and upper bound can can happen one or more and the bound should be seperated by -
and the ranges seperated by comma

*/
};

export function collect(value: any, previous: any[]) {
  return previous.concat([value]);
}

export const episodesSeperated = (value: string) => {
  /*  const season = value.split;
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

  return _.sortBy(unique, (o: number) => o); */
};
