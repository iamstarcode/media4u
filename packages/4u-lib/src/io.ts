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
import { convert, detect, parse } from 'subsrt-ts';

import { ContentCaption } from 'subsrt-ts/dist/types/handler';
import { CLI } from './index.js';

export type CaptionCueType = ContentCaption;

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

export async function downloadFile({
  url,
  media,
}: {
  url: string;
  media: {
    type: string;
    title: string;
    episode: { number: number };
    season: { number: number };
  };
}) {
  const { filename, saveDir } = getFileAndFolderNameFromMedia(media);
  const maxRetries = 3; // Adjust as needed (consider success rate and API limits)
  let attempts = 0;

  let message = 'Now Downloading ';
  if (media.type == 'show') {
    message += `${media.title} Season ${media.season.number} Episode ${media.episode.number}`;
  } else {
    message += `${media.title}`;
  }
  CLI.printInfo(message);
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

  while (attempts < maxRetries) {
    try {
      createDirIfNotFound(saveDir!);

      const dl = new DownloaderHelper(url, saveDir, {
        fileName: { name: filename! },
        override: true,
        resumeIfFileExists: true,
        resumeOnIncomplete: true,
      });

      const size = await dl.getTotalSize();

      bar.start(100);

      dl.on('error', async (err) => {
        attempts++;
        bar.stop();
        console.log(`Download Failed (Attempt ${attempts}/${maxRetries})`, err); // Log attempt number

        // Optional delay or backoff strategy for retries
        if (attempts < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
        }
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
        CLI.printInfo(chalk.greenBright.bold(`Download complete \u2713 `)); // ✔
        return; // Exit the loop on successful download
      });

      await dl.start();
    } catch (err) {
      attempts++;
      CLI.printError(
        `Download Failed (Attempt retry ${attempts}/${maxRetries}) \n ${err}`
      );
      bar.stop();
    }
  }

  console.error('Failed to download file after retries.');
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

  createDirIfNotFound(cacheDir);
  await m3u8Download(url, {
    showProgress: true,
    filename,
    cacheDir,
    saveDir,
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

export async function downloadSubtitle(url: string, filePath: fs.PathLike) {
  try {
    const data = await fetch(url).then((v) => v.text());
    if (!data) throw new Error('failed to get caption data');

    const output = convertSubtitlesToSrt(data);

    fs.writeFileSync(filePath + '.' + 'srt', output, {
      encoding: 'utf8',
    });
  } catch (error) {
    console.log(error);
  }
}

export function convertSubtitlesToSrt(text: string): string {
  const textTrimmed = text.trim();
  if (textTrimmed === '') {
    throw new Error('Given text is empty');
  }
  const srt = convert(textTrimmed, 'srt');
  if (detect(srt) === '') {
    throw new Error('Invalid subtitle format');
  }
  return srt;
}

export function getFileAndFolderNameFromMedia(media: {
  type: string;
  title: string;
  episode: { number: number };
  season: { number: number };
}) {
  let filename = '';
  let saveDir: string = '';

  if (
    media.type.toLocaleLowerCase() == 'tv' ||
    media.type.toLocaleLowerCase() == 'show'
  ) {
    let episodeString = 'E';
    let seasonString = 'S';
    if (media.season.number < 10) {
      seasonString += '0' + media.season.number;
    } else {
      seasonString += media.season.number;
    }
    if (media.episode.number < 10) {
      episodeString += '0' + media.episode.number;
    } else {
      episodeString += media.episode.number;
    }
    saveDir = path.join(sanitizeDirName(media.title), seasonString);
    createDirIfNotFound(saveDir);

    filename =
      sanitizeFileName(media.title) + '.' + seasonString + episodeString;
  } else {
    filename = sanitizeFileName(media.title);
    saveDir = path.resolve('.');
  }

  return { filename, saveDir };
}
