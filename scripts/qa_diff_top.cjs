/* Band-compare the top of reference/UI_Image_1425.png vs a local capture. */
const fs = require('fs');
const zlib = require('zlib');

function loadPNG(file) {
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
  return { width, height, px };
}

function bands(img, bandH, maxH) {
  const { width, height, px } = img;
  const out = [];
  const limit = Math.min(height, maxH);
  for (let y = 0; y < limit; y += bandH) {
    const counts = {};
    let total = 0;
    const yEnd = Math.min(y + bandH, limit);
    for (let yy = y; yy < yEnd; yy += 3) {
      for (let x = 0; x < width; x += 6) {
        const i = (yy * width + x) * 3;
        const r = px[i], g = px[i + 1], b = px[i + 2];
        const key = (Math.round(r / 24) * 24) + ',' + (Math.round(g / 24) * 24) + ',' + (Math.round(b / 24) * 24);
        counts[key] = (counts[key] || 0) + 1;
        total++;
      }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    out.push(sorted.map(([k, v]) => 'rgb(' + k + ') ' + (v / total * 100).toFixed(0) + '%').join(' | '));
  }
  return out;
}

const ref = loadPNG('reference/UI_Image_1425.png');
const loc = loadPNG(process.argv[2] || 'full_local.png');
console.log('REF ' + ref.width + 'x' + ref.height + '  LOC ' + loc.width + 'x' + loc.height);
const bandH = 250;
const r = bands(ref, bandH, ref.height);
const l = bands(loc, bandH, ref.height);
for (let i = 0; i < r.length; i++) {
  const y = i * bandH;
  console.log('y=' + y + '  REF: ' + r[i]);
  console.log('       LOC: ' + l[i]);
}
