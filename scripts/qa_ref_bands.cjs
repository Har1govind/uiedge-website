/* Band analysis of the dark reference (UI_Image.png) section regions. */
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
console.log('img ' + width + 'x' + height);
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

// Sections: name, refY0, refY1, numBands
const SECTIONS = [
  ['hero', 0, 5600, 6],
  ['projects', 5600, 17600, 5],
  ['why', 17632, 24852, 5],
  ['services', 24852, 32972, 6],
  ['showreel', 32972, 42162, 6],
  ['testimonials', 42162, 48418, 5],
  ['text', 48418, 52569, 4],
  ['case', 52569, 58112, 5],
  ['pricing', 58112, 66495, 6],
  ['team', 66495, 71736, 4],
  ['faq', 71736, 76658, 4],
  ['blog', 76658, 82108, 5],
  ['cta', 82108, 87000, 4],
];

function bands(y0, y1, n) {
  const bh = (y1 - y0) / n;
  const res = [];
  for (let bi = 0; bi < n; bi++) {
    const sy = Math.round(y0 + bi * bh);
    const ey = Math.round(y0 + (bi + 1) * bh);
    const counts = {};
    let total = 0;
    for (let yy = sy; yy < ey; yy += 4) {
      for (let x = 0; x < width; x += 8) {
        const i = (yy * width + x) * 3;
        const r = px[i], g = px[i + 1], b = px[i + 2];
        const key = (Math.round(r / 16) * 16) + ',' + (Math.round(g / 16) * 16) + ',' + (Math.round(b / 16) * 16);
        counts[key] = (counts[key] || 0) + 1;
        total++;
      }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    res.push(sorted.map(([k, v]) => 'rgb(' + k + ') ' + (v / total * 100).toFixed(0) + '%').join(' | '));
  }
  return res;
}

for (const [name, y0, y1, n] of SECTIONS) {
  console.log('=== ' + name + ' (ref y=' + y0 + '..' + y1 + ') ===');
  const b = bands(y0, y1, n);
  b.forEach((line, i) => console.log('  band' + i + ': ' + line));
}
