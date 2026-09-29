/* Crop a region of the reference image (native 7632x20096) and print band colors. */
const fs = require('fs');
const zlib = require('zlib');

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function decodePNG(path) {
  const buf = fs.readFileSync(path);
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idats = [];
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
      idats.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const stride = width * bpp;
  const px = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const rowStart = y * (stride + 1) + 1;
    let prev = Buffer.alloc(stride);
    let cur = Buffer.alloc(stride);
    raw.copy(cur, 0, rowStart, rowStart + stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = y > 0 ? prev[x] : 0;
      const c = y > 0 && x >= bpp ? prev[x - bpp] : 0;
      let val = cur[x];
      if (filter === 1) val = (val + a) & 0xff;
      else if (filter === 2) val = (val + b) & 0xff;
      else if (filter === 3) val = (val + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        val = (val + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
      }
      cur[x] = val;
    }
    for (let x = 0; x < width; x++) {
      if (colorType === 6) {
        px[(y * width + x) * 4] = cur[x * 4];
        px[(y * width + x) * 4 + 1] = cur[x * 4 + 1];
        px[(y * width + x) * 4 + 2] = cur[x * 4 + 2];
        px[(y * width + x) * 4 + 3] = cur[x * 4 + 3];
      } else if (colorType === 2) {
        px[(y * width + x) * 4] = cur[x * 3];
        px[(y * width + x) * 4 + 1] = cur[x * 3 + 1];
        px[(y * width + x) * 4 + 2] = cur[x * 3 + 2];
        px[(y * width + x) * 4 + 3] = 255;
      }
    }
    prev = cur;
  }
  return { width, height, px };
}

function analyze(img, x0, y0, w, h, rows) {
  const out = [];
  const rowH = Math.floor(h / rows);
  for (let r = 0; r < rows; r++) {
    const counts = new Map();
    for (let y = y0 + r * rowH; y < y0 + (r + 1) * rowH && y < img.height; y++) {
      for (let x = x0; x < Math.min(x0 + w, img.width); x += 4) {
        const i = (y * img.width + x) * 4;
        const r2 = img.px[i], g = img.px[i + 1], b = img.px[i + 2];
        const key = Math.round(r2 / 32) * 32 + ',' + Math.round(g / 32) * 32 + ',' + Math.round(b / 32) * 32;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    out.push('y=' + (y0 + r * rowH) + ': ' + top.map(([k, v]) => `rgb(${k}) ${(v / total * 100).toFixed(1)}%`).join(' | '));
  }
  return out;
}

const img = decodePNG(process.argv[2]);
const x = parseInt(process.argv[3] || '0', 10);
const y = parseInt(process.argv[4] || '0', 10);
const w = parseInt(process.argv[5] || '7632', 10);
const h = parseInt(process.argv[6] || '2000', 10);
const rows = parseInt(process.argv[7] || '10', 10);
console.log('IMG ' + img.width + 'x' + img.height);
console.log(analyze(img, x, y, w, h, rows).join('\n'));
