export function humanFileSize(bytes: number, si = false) {
  let u,
    b = bytes,
    t = si ? 1000 : 1024;
  ['', si ? 'k' : 'K', ...'MGTPEZY'].find(
    (x) => ((u = x), (b /= t), b ** 2 < 1)
  );
  return `${u ? (t * b).toFixed(1) : bytes}${u}${!si && u ? 'i' : ''}B`;
}
