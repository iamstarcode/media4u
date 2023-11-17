import fs from 'fs';
import path from 'path';

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

export const createFolderIfNotFound = (folder: string) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

export const sanitizeName = (folderName: string) => {
  const forbiddenChars = /[\/:*?"<>|]/g;
  const safeReplacements: any = {
    //'/': '_',
    //'\\': '_',
    ':': '-',
    '*': '-',
    '?': '-',
    '"': "'",
    '<': '-',
    '>': '-',
    '|': '-',
  };

  //
  // Replace forbidden characters with safe alternatives
  folderName = folderName.replace(
    forbiddenChars,
    (match: string | number) => safeReplacements[match] || ''
  );

  return folderName;
};

export function sanitizeFolderName(folderName: string) {
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
