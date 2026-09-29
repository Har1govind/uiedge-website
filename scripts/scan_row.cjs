/* Scan a horizontal row of a PNG, printing color runs (no deps). */
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2];
const rowY = parseInt(process.argv[3] || '100', 10);
const x0 = parseInt(process.argv[4] || '0', 10);
const x1 = parseInt(process.argv[5] || '1425', 10);

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
if (rowY >= height) { console.log('row out of bounds'); process.exit(0); }
let runs = [];
let cur = null;
for (let x = x0; x < Math.min(x1, width); x++) {
  const i = (rowY * width + x) * 3;
  const key = Math.round(px[i] / 12) * 12 + ',' + Math.round(px[i + 1] / 12) * 12 + ',' + Math.round(px[i + 2] / 12) * 12;
  if (!cur || cur.key !== key) {
    if (cur) runs.push(cur);
    cur = { key, start: x, len: 0 };
  }
  cur.len++;
}
if (cur) runs.push(cur);
// merge short alternating runs of similar brightness
const out2 = [];
for (const r of runs) {
  if (out2.length && r.len <= 3 && out2[out2.length - 1].end === r.start - 1) {
    // merge into previous
  }
  r.end = r.start + r.len - 1;
  out2.push(r);
}
for (const r of out2) {
  if (r.len < 2) continue;
  console.log('x=' + r.start + '-' + r.end + ' (' + r.len + 'px) rgb(' + r.key + ')');
}
