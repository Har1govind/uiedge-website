/* Analyze dominant colors in a crop of a PNG (no deps). */
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2];
const cx = parseInt(process.argv[3] || '0', 10);
const cy = parseInt(process.argv[4] || '0', 10);
const cw = parseInt(process.argv[5] || '0', 10);
const ch = parseInt(process.argv[6] || '0', 10);

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

const x0 = cw ? cx : 0, y0 = ch ? cy : 0;
const x1 = cw ? Math.min(cx + cw, width) : width;
const y1 = ch ? Math.min(cy + ch, height) : height;
const counts = {};
let total = 0;
for (let y = y0; y < y1; y += 3) {
  for (let x = x0; x < x1; x += 3) {
    const i = (y * width + x) * 3;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const key = (Math.round(r / 16) * 16) + ',' + (Math.round(g / 16) * 16) + ',' + (Math.round(b / 16) * 16);
    counts[key] = (counts[key] || 0) + 1;
    total++;
  }
}
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log('crop x=' + x0 + '-' + x1 + ' y=' + y0 + '-' + y1 + ' (img ' + width + 'x' + height + ')');
for (const [k, v] of sorted) console.log('  rgb(' + k + ') ~' + (v / total * 100).toFixed(1) + '%');
