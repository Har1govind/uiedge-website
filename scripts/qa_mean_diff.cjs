/* Compare mean color per horizontal band between two PNGs (same width). */
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

const ref = loadPNG('reference/UI_Image_1425.png');
const loc = loadPNG(process.argv[2] || 'full_local.png');
const bandH = 200;

function meanBands(img, maxH) {
  const { width, height, px } = img;
  const out = [];
  const limit = Math.min(height, maxH);
  for (let y = 0; y < limit; y += bandH) {
    let r = 0, g = 0, b = 0, n = 0;
    const yEnd = Math.min(y + bandH, limit);
    for (let yy = y; yy < yEnd; yy += 2) {
      for (let x = 0; x < width; x += 3) {
        const i = (yy * width + x) * 3;
        r += px[i]; g += px[i + 1]; b += px[i + 2]; n++;
      }
    }
    out.push({ y, r: r / n, g: g / n, b: b / n });
  }
  return out;
}

const rm = meanBands(ref, ref.height);
const lm = meanBands(loc, ref.height);
for (let i = 0; i < rm.length; i++) {
  const R = rm[i], L = lm[i];
  const dr = Math.abs(R.r - L.r), dg = Math.abs(R.g - L.g), db = Math.abs(R.b - L.b);
  const diff = Math.round((dr + dg + db) / 3);
  const flag = diff > 40 ? ' <<<' : '';
  console.log('y=' + String(R.y).padStart(4) + '  REF (' + Math.round(R.r) + ',' + Math.round(R.g) + ',' + Math.round(R.b) + ')  LOC (' + Math.round(L.r) + ',' + Math.round(L.g) + ',' + Math.round(L.b) + ')  diff=' + diff + flag);
}
