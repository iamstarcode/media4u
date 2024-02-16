import { ANIME, MOVIES } from '@consumet/extensions';

(async () => {
  const p = new ANIME.Gogoanime();
  p.search('naruto').then((data) => {
    console.log(data);
  });
})();
