/* Determine reference scale: check which candidate scale puts the wordmark at the right place. */
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

// Live wordmark svg#1: local x=58-813, y=151-357 (at 1425 width)
// For each candidate scale S, compute wordmark ref-y band and measure white density in that band
const candidates = [4.0, 4.5, 5.0, 5.356, 5.3, 5.5, 6.0, 8.0];
console.log('Testing candidate scales (wordmark = white pixels at local y=151-357):');
for (const S of candidates) {
  const yA = Math.round(151 * S), yB = Math.round(357 * S);
  let white = 0, total = 0;
  for (let y = yA; y < yB; y += 6) {
    for (let x = 300; x < 4600; x += 6) {
      const i = (y * width + x) * 3;
      const v = (px[i] + px[i + 1] + px[i + 2]) / 3;
      if (v >= 220) white++;
      total++;
    }
  }
  console.log('  S=' + S + ' wordmark y=' + yA + '-' + yB + ' white%=' + (white / total * 100).toFixed(1));
}

// Also test pill positions: pills at local y=225-347 (Branding/SEO etc)
console.log('Pills at local y=225-347, x=1146-1389:');
for (const S of candidates) {
  const yA = Math.round(225 * S), yB = Math.round(347 * S);
  const xA = Math.round(1146 * S), xB = Math.round(1389 * S);
  let white = 0, total = 0;
  for (let y = yA; y < yB; y += 6) {
    for (let x = xA; x < xB; x += 6) {
      const i = (y * width + x) * 3;
      const v = (px[i] + px[i + 1] + px[i + 2]) / 3;
      if (v >= 220) white++;
      total++;
    }
  }
  console.log('  S=' + S + ' pills y=' + yA + '-' + yB + ' white%=' + (white / total * 100).toFixed(1));
}
