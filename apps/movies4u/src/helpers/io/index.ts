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
