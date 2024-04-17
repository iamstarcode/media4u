import * as crypto from 'crypto';

export function formatTime(timeString: string) {
  const [hours, minutes, seconds] = timeString.split(':').map(parseFloat);
  const secs = Math.floor(seconds);
  const millisecs = Math.floor((seconds - secs) * 100);

  let formattedTime = '';
  if (hours > 0) {
    formattedTime += `${hours}h`;
  }
  if (minutes > 0) {
    formattedTime += `${minutes}m`;
  }
  if (secs > 0 || (hours === 0 && minutes === 0)) {
    formattedTime += `${secs}s`;
  }
  if (millisecs > 0 && hours === 0 && minutes === 0) {
    formattedTime += `${millisecs}ms`;
  }

  return formattedTime;
}

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
