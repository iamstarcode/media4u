import chalk from 'chalk';
import _ from 'lodash';

const episodesSeperated = (value: string) => {
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
