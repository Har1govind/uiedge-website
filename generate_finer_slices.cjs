const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const imagePath = 'reference/UI_Image.png';
  const outDir = path.join('reference', 'finer_slices');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Let's create even more focused slices covering every 1000 pixels from 0 to 20096
  const step = 1000;
  let html = '<html><body style="background:#111; color:#fff; font-family:sans-serif;"><h1>Finer Slices (1000px steps)</h1>';
  for (let top = 0; top < 20096; top += step) {
    const height = Math.min(step, 20096 - top);
    const filename = `slice_${top}.png`;
    const filepath = path.join(outDir, filename);
    await sharp(imagePath)
      .extract({ left: 0, top, width: 7632, height })
      .resize({ width: 1600 })
      .png()
      .toFile(filepath);
    html += `<h2>Top: ${top}, Height: ${height}</h2><img src="${filename}" style="width:100%; border:1px solid #444;"/><hr/>`;
  }
  html += '</body></html>';
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log('Finer slices created.');
}
run();
