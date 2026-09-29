/* Measure hero wordmark/pills positions in the downscaled reference (1425 wide). */
const fs = require('fs');
const zlib = require('zlib');

const file = 'reference/UI_Image_1425.png';
const buf = fs.readFileSync(file);
let pos = 8;
let width = 0, height = 0, colorType = 0;
const idat = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  const data = buf.slice(pos + 8, pos + 8 + len);
  if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9]; }
  else if (type === 'IDAT') idat.push(data);
  else if (type === 'IEND') break;
  pos += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idat));
const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
const stride = width * bpp;
const px = Buffer.alloc(width * height * 3);
let out = 0;
let prev = Buffer.alloc(stride);
for (let y = 0; y < height; y++) {
  const filter = raw[y * (stride + 1)];
  const line = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1));
  const recon = Buffer.alloc(stride);
  for (let x = 0; x < stride; x++) {
    const a = x >= bpp ? recon[x - bpp] : 0;
    const b = prev[x];
    const c = x >= bpp ? prev[x - bpp] : 0;
    let v = line[x];
    if (filter === 1) v = (v + a) & 0xff;
    else if (filter === 2) v = (v + b) & 0xff;
    else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
    else if (filter === 4) {
      const p = a + b - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
    }
    recon[x] = v;
  }
  prev = recon;
  for (let x = 0; x < width; x++) {
    let r, g, bl;
    if (colorType === 6) { r = recon[x*4]; g = recon[x*4+1]; bl = recon[x*4+2]; }
    else if (colorType === 2) { r = recon[x*3]; g = recon[x*3+1]; bl = recon[x*3+2]; }
    else { r = g = bl = recon[x]; }
    px[out++] = r; px[out++] = g; px[out++] = bl;
  }
}

// Scan a horizontal row and print runs with brightness, x=0-1425
function scanRow(y) {
  const runs = [];
  let cur = null;
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 3;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const v = (r + g + b) / 3;
    const key = Math.round(v / 16) * 16;
    if (!cur || cur.key !== key) {
      if (cur && cur.len >= 3) runs.push(cur);
      cur = { key, start: x, len: 0 };
    }
    cur.len++;
  }
  if (cur && cur.len >= 3) runs.push(cur);
  return runs.slice(0, 16).map((r) => 'x=' + r.start + '-' + (r.start + r.len) + ' v' + r.key);
}

// hero: wordmark at live y=151-357 (local). In ref 1425, same scale.
console.log('wordmark row y=200:', scanRow(200).join(' | '));
console.log('wordmark row y=250:', scanRow(250).join(' | '));
console.log('wordmark row y=300:', scanRow(300).join(' | '));
console.log('pills row y=320:', scanRow(320).join(' | '));
console.log('bottom row y=700:', scanRow(700).join(' | '));
console.log('clients strip y=800:', scanRow(800).join(' | '));
