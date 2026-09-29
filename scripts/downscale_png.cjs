/* Downscale reference image to 1425-wide, save as PNG for direct comparison. */
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2] || 'reference/UI_Image.png';
const out = process.argv[3] || 'reference/UI_Image_1425.png';
const TARGET_W = parseInt(process.argv[4] || '1425', 10);

// Read PNG
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
let outI = 0;
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
    px[outI++] = r; px[outI++] = g; px[outI++] = bl;
  }
}

// Downscale (box average)
const scale = width / TARGET_W;
const outH = Math.floor(height / scale);
const outPx = Buffer.alloc(TARGET_W * outH * 3);
for (let y = 0; y < outH; y++) {
  const sy0 = Math.floor(y * scale), sy1 = Math.min(Math.floor((y + 1) * scale), height);
  for (let x = 0; x < TARGET_W; x++) {
    const sx0 = Math.floor(x * scale), sx1 = Math.min(Math.floor((x + 1) * scale), width);
    let r = 0, g = 0, b = 0, n = 0;
    for (let yy = sy0; yy < sy1; yy += Math.max(1, Math.floor(scale / 2))) {
      for (let xx = sx0; xx < sx1; xx += Math.max(1, Math.floor(scale / 2))) {
        const i = (yy * width + xx) * 3;
        r += px[i]; g += px[i + 1]; b += px[i + 2]; n++;
      }
    }
    const o = (y * TARGET_W + x) * 3;
    outPx[o] = Math.round(r / n); outPx[o + 1] = Math.round(g / n); outPx[o + 2] = Math.round(b / n);
  }
}

// Write PNG (RGB, no filter)
function crc32(b) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < b.length; i++) crc = (crc >>> 8) ^ table[(crc ^ b[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(TARGET_W, 0); ihdr.writeUInt32BE(outH, 4);
ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
const rawData = Buffer.alloc((TARGET_W * 3 + 1) * outH);
for (let y = 0; y < outH; y++) {
  rawData[y * (TARGET_W * 3 + 1)] = 0;
  outPx.copy(rawData, y * (TARGET_W * 3 + 1) + 1, y * TARGET_W * 3, (y + 1) * TARGET_W * 3);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(rawData)),
  chunk('IEND', Buffer.alloc(0)),
]);
fs.writeFileSync(out, png);
console.log('saved ' + out + ' ' + TARGET_W + 'x' + outH);
