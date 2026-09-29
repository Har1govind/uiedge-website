/* Density profile of bright pixels in the reference to locate the wordmark. */
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2] || 'reference/UI_Image.png';

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

console.log('img ' + width + 'x' + height);
// Wordmark region: look at rows 800-2100 (assuming 5.356 scale), full x
console.log('=== Row bright% (x=300-4600), y=700-2400 ===');
for (let y = 700; y < 2400; y += 50) {
  let bright = 0;
  for (let x = 300; x < 4600; x += 4) {
    const i = (y * width + x) * 3;
    const v = (px[i] + px[i + 1] + px[i + 2]) / 3;
    if (v >= 210) bright++;
  }
  console.log('y=' + y + ' bright%=' + (bright / 1075 * 100).toFixed(1));
}
