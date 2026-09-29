/* Crop a region of the big reference PNG and save as PNG (no deps). */
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2];
const cx = parseInt(process.argv[3] || '0', 10);
const cy = parseInt(process.argv[4] || '0', 10);
const cw = parseInt(process.argv[5] || '0', 10);
const ch = parseInt(process.argv[6] || '0', 10);
const out = process.argv[7] || 'crop.png';

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
let outi = 0;
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
    px[outi++] = r; px[outi++] = g; px[outi++] = bl;
  }
}

// crop
const W2 = cw || width, H2 = ch || height;
const outPx = Buffer.alloc(W2 * H2 * 3);
for (let y = 0; y < H2; y++) {
  for (let x = 0; x < W2; x++) {
    const si = ((y + cy) * width + (x + cx)) * 3;
    const di = (y * W2 + x) * 3;
    outPx[di] = px[si]; outPx[di + 1] = px[si + 1]; outPx[di + 2] = px[si + 2];
  }
}

// write PNG
function crc32(b) {
  let c, crc = 0xffffffff;
  for (let i = 0; i < b.length; i++) {
    c = (crc ^ b[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W2, 0);
ihdr.writeUInt32BE(H2, 4);
ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
// raw data with filter 0 per line
const rawOut = Buffer.alloc(H2 * (W2 * 3 + 1));
for (let y = 0; y < H2; y++) {
  rawOut[y * (W2 * 3 + 1)] = 0;
  outPx.copy(rawOut, y * (W2 * 3 + 1) + 1, y * W2 * 3, (y + 1) * W2 * 3);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(rawOut)),
  chunk('IEND', Buffer.alloc(0)),
]);
fs.writeFileSync(out, png);
console.log('saved ' + out + ' ' + W2 + 'x' + H2);
