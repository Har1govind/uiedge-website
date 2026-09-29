/* Scan reference image rows to map the projects section structure. (pure JS PNG decode) */
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2] || 'reference/UI_Image.png';
const buf = fs.readFileSync(file);
let pos = 8, width = 0, height = 0, colorType = 0, bitDepth = 0;
const idat = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  const data = buf.slice(pos + 8, pos + 8 + len);
  if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
  else if (type === 'IDAT') idat.push(data);
  else if (type === 'IEND') break;
  pos += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idat));
const bpp = colorType === 6 ? 4 : 3;
const stride = width * bpp;
const px = Buffer.alloc(width * height * 4);
// un-filter
const prev = Buffer.alloc(stride);
const cur = Buffer.alloc(stride);
for (let y = 0; y < height; y++) {
  const f = raw[y * (stride + 1)];
  raw.copy(cur, 0, y * (stride + 1) + 1, (y + 1) * (stride + 1));
  for (let x = 0; x < stride; x++) {
    const a = x >= bpp ? cur[x - bpp] : 0;
    const b = prev[x];
    const c = x >= bpp ? prev[x - bpp] : 0;
    let v = cur[x];
    if (f === 1) v += a;
    else if (f === 2) v += b;
    else if (f === 3) v += (a + b) >> 1;
    else if (f === 4) { const p = a + b - c; const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
    cur[x] = v & 0xff;
  }
  for (let x = 0; x < width; x++) {
    const si = x * bpp;
    if (colorType === 6) { px[(y * width + x) * 4] = cur[si]; px[(y * width + x) * 4 + 1] = cur[si + 1]; px[(y * width + x) * 4 + 2] = cur[si + 2]; px[(y * width + x) * 4 + 3] = cur[si + 3]; }
    else { px[(y * width + x) * 4] = cur[si]; px[(y * width + x) * 4 + 1] = cur[si + 1]; px[(y * width + x) * 4 + 2] = cur[si + 2]; px[(y * width + x) * 4 + 3] = 255; }
  }
  prev.set(cur);
}

function scanRow(y) {
  const buckets = [];
  const NB = 16;
  for (let b = 0; b < NB; b++) {
    let r = 0, g = 0, bl = 0, n = 0;
    for (let x = Math.floor(b * width / NB); x < Math.floor((b + 1) * width / NB); x++) {
      const i = (y * width + x) * 4;
      r += px[i]; g += px[i + 1]; bl += px[i + 2]; n++;
    }
    buckets.push(`[${Math.floor(b * width / NB)}-${Math.floor((b + 1) * width / NB)}](${Math.round(r / n)},${Math.round(g / n)},${Math.round(bl / n)})`);
  }
  return buckets.join(' ');
}

// rows across the projects region at native scale (probe scale 5.356: projects ~4800-19200)
for (const y of [4000, 5500, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000]) {
  console.log('y=' + y + '  ' + scanRow(y));
}
console.log('width=' + width + ' height=' + height);
