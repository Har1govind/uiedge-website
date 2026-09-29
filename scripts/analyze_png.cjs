/* Sample dominant colors of a PNG file. Requires no deps — parse PNG with zlib inflate. */
const fs = require('fs');
const zlib = require('zlib');

function analyze(path) {
  const buf = fs.readFileSync(path);
  if (buf.toString('ascii', 1, 4) !== 'PNG') { console.log('not png'); return; }
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 3 ? 1 : 1;
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
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        v = (v + pr) & 0xff;
      }
      recon[x] = v;
    }
    prev = recon;
    for (let x = 0; x < width; x++) {
      let r, g, bl;
      if (colorType === 6) { r = recon[x*4]; g = recon[x*4+1]; bl = recon[x*4+2]; }
      else if (colorType === 2) { r = recon[x*3]; g = recon[x*3+1]; bl = recon[x*3+2]; }
      else { r = g = bl = recon[x]; }
      // sample every 3rd pixel for speed
      if ((x + y * width) % 3 === 0) {
        px[out++] = r; px[out++] = g; px[out++] = bl;
      }
    }
  }
  // quantize to 32 levels
  const buckets = new Map();
  const total = out / 3;
  for (let i = 0; i < out; i += 3) {
    const key = (px[i] >> 5) * 64 + (px[i+1] >> 5) * 8 + (px[i+2] >> 5);
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
  console.log(path, 'size', width + 'x' + height, 'sampled', total);
  for (const [key, count] of sorted.slice(0, 14)) {
    const r = (key >> 6) * 32 + 16, g = ((key >> 3) & 7) * 32 + 16, b = (key & 7) * 32 + 16;
    console.log('  rgb(' + r + ',' + g + ',' + b + ') ~' + (count / total * 100).toFixed(1) + '%');
  }
}
for (const f of process.argv.slice(2)) analyze(f);
