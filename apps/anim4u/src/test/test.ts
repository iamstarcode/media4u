import {
  createFileIfNotFound,
  createFolderIfNotFound,
  sanitizeFileName,
  sanitizeFolderName,
  sanitizeName,
} from '../helpers/io/index.js';

(async () => {
  const originalFileName = 'my/file:name?<>|example';

  createFileIfNotFound(
    sanitizeFolderName('fff?/:f'),
    sanitizeFileName('Dr. Stones-Stone Wars.json'),
    'nthntjhntjh'
  );
})();
