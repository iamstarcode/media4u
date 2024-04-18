import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cliProgress from 'cli-progress';

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
//import { IO } from '.';
import { humanFileSize } from './util.js';
import { DownloaderHelper } from 'node-downloader-helper';
import { m3u8Download } from '@lzwme/m3u8-dl';

export function fileDirName(meta: any) {
  const __filename = fileURLToPath(meta.url);
  const __dirname = dirname(__filename);
  return { __dirname, __filename };
}

export const createFileIfNotFound = (
  folder: string,
  fileName: string,
  content: any
) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  fs.writeFileSync(path.join(folder, fileName), content, {
    encoding: 'utf-8',
    flag: 'w',
  });

  const file = fs.readFileSync(path.join(folder, fileName));
  return file;
};

export const createDirIfNotFound = (folder: string) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

export const sanitizeName = (folderName: string) => {
  const forbiddenChars = /[\/:*?"<>|]/g;
  const safeReplacements: any = {
    ':': '-',
    '*': '-',
    '?': '-',
    '"': "'",
    '<': '-',
    '>': '-',
    '|': '-',
  };

  folderName = folderName.replace(
    forbiddenChars,
    (match: string | number) => safeReplacements[match] || ''
  );

  return folderName;
};

export function sanitizeDirName(folderName: string) {
  // Define a regular expression to match special characters
  const regex = /[<>:"\/\\|?*]/g;

  const sanitizedFolderName = folderName.replace(regex, '-');

  return sanitizedFolderName;
}

export function sanitizeFileName(fileName: string) {
  // Define a regular expression to match special characters
  const specialCharsRegex = /[<>:"\/\\|?*\x00-\x1F\s]/g;

  // Replace special characters with a safe character, e.g., an underscore
  const sanitizedFileName = fileName.replace(specialCharsRegex, '.');

  return sanitizedFileName;
}

export async function downloadFile(
  url: string,
  fileName: string,
  folder: string = './'
) {
  const bar = new cliProgress.SingleBar(
    {
      format:
        '{percentage}% [' +
        chalk.green(`{bar}`) +
        ']' +
        chalk.blue(' {downloaded}/{size}') +
        chalk.yellow(' {duration_formatted} ') +
        chalk.hex('#28B5C0')('{speed}/s'),
      hideCursor: true,
      barsize: 20,
      forceRedraw: true,
    },
    cliProgress.Presets.legacy
  );

  createDirIfNotFound(folder);

  const dl = new DownloaderHelper(url, folder, {
    fileName: { name: fileName },
    override: true,
  });

  const size = await dl.getTotalSize();

  bar.start(100);

  dl.on('error', (err) => {
    bar.stop();
    console.log('Download Failed', err);
  });

  dl.on('progress', ({ speed, progress, downloaded }) => {
    bar.update(Math.ceil(progress), {
      speed: humanFileSize(speed),
      downloaded: humanFileSize(downloaded),
      size: humanFileSize(size.total ?? 0),
    });
  });

  dl.on('end', () => {
    bar.stop();
    console.log(chalk.greenBright.bold(`Download complete \u2713 `)); //
  });

  await dl.start().catch((err) => {
    console.error(err);
    bar.stop();
  });
}

async function downloadSubtitle(url: string, filePath: fs.PathLike) {
  try {
    //const outputFilepath = 'path/to/your/folder/your_movie.vtt';
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const subtitleContent = await response.text();
    fs.writeFileSync(filePath, subtitleContent, 'utf8');
  } catch (error) {
    console.log(error);
  }
}

export function getFileAndFolderNameFromMedia(media: {
  type: string;
  title: string;
  episode: { number: number };
  season: { number: number };
}) {
  let filename = '';
  let saveDir: string | undefined = '';

  if (
    media.type.toLocaleLowerCase() == 'tv' ||
    media.type.toLocaleLowerCase() == 'show'
  ) {
    let episodeString = 'E';
    let seasonString = 'S';
    if (media.episode.number < 10) {
      seasonString += '0' + media.episode.number;
    } else {
      seasonString += media.season.number;
    }
    if (media.episode.number! < 10) {
      episodeString += '0' + media.episode.number;
    } else {
      seasonString += media.episode.number;
    }
    saveDir = path.join(sanitizeDirName(media.title), seasonString);
    createDirIfNotFound(saveDir);

    filename =
      sanitizeFileName(media.title) + '.' + seasonString + episodeString;
  } else {
    filename = sanitizeFileName(media.title);
    saveDir = undefined;
  }

  return { filename, saveDir };
}

export async function downloadStream({
  url,
  media,
  cacheDir,
  headers,
}: {
  url: string;
  cacheDir: string;
  headers: { [key: string]: string };
  media: {
    type: string;
    title: string;
    episode: { number: number };
    season: { number: number };
  };
}) {
  const { filename, saveDir } = getFileAndFolderNameFromMedia(media);
  await m3u8Download(url, {
    showProgress: true,
    filename,
    cacheDir,
    saveDir: saveDir,
    headers,
  });

  if (fs.existsSync(cacheDir)) {
    const files = fs.readdirSync(cacheDir);

    files.forEach((file) => {
      const filePath = path.join(cacheDir, file);
      fs.unlinkSync(filePath);
    });

    fs.rmdirSync(cacheDir);
  } else {
    console.log(`Folder ${cacheDir} not found.`);
  }
}
