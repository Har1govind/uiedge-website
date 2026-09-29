const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const imagePath = 'reference/UI_Image.png';
  const outDir = path.join('reference', 'slices');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const chunks = 16;
  const chunkHeight = Math.floor(20096 / chunks);
  
  let html = '<html><body style="background:#111; color:#fff; font-family:sans-serif;"><h1>UI_Image Slices</h1>';
  for (let i = 0; i < chunks; i++) {
    const top = i * chunkHeight;
    const height = (i === chunks - 1) ? (20096 - top) : chunkHeight;
    const filename = `slice_${i}.png`;
    const filepath = path.join(outDir, filename);
    
    await sharp(imagePath)
      .extract({ left: 0, top, width: 7632, height })
      .resize({ width: 1400 })
      .png()
      .toFile(filepath);
      
    html += `<h2>Slice ${i} (top: ${top}, height: ${height})</h2><img src="${filename}" style="width:100%; border:1px solid #444;"/><hr/>`;
  }
  html += '</body></html>';
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log('Slices created successfully.');
}
run();
