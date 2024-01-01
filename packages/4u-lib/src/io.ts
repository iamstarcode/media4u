import { fileURLToPath } from 'url';
import { dirname } from 'path';

import fs from 'fs';
import path from 'path';

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
  const specialCharsRegex = /[*\\/:?"><|]/g;

  // Replace special characters with a safe character, e.g., an underscore
  const sanitizedFileName = fileName.replace(specialCharsRegex, '-');

  return sanitizedFileName;
}
