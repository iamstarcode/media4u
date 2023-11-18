import { IO } from '@iamstarcode/4u-lib';

(async () => {
  const originalFileName = 'my/file:name?<>|example';

  //
  IO.createFileIfNotFound(
    IO.sanitizeFolderName('fff?/:f'),
    IO.sanitizeFileName('Dr. Stones-Stone Wars.json'),
    'nthntjhntjh'
  );
})();
