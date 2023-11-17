import path from 'node:path';

import fileDirName from '../utils/file-dir-name.js';

import { homedir } from 'os';

export const { __dirname, __filename } = fileDirName(import.meta);

export const appPath = path.join(homedir(), '/movie4u');
