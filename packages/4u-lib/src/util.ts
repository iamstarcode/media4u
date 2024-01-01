import * as crypto from 'crypto';

export function humanFileSize(bytes: number, si = false) {
  let u,
    b = bytes,
    t = si ? 1000 : 1024;
  ['', si ? 'k' : 'K', ...'MGTPEZY'].find(
    (x) => ((u = x), (b /= t), b ** 2 < 1)
  );
  return `${u ? (t * b).toFixed(1) : bytes}${u}${!si && u ? 'i' : ''}B`;
}

function md5FromUrl(url: string): string {
  const urlBytes = Buffer.from(url, 'utf-8');
  const md5Hash = crypto.createHash('md5');
  md5Hash.update(urlBytes);
  const md5Hex = md5Hash.digest('hex');
  return md5Hex;
}
