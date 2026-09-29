const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const imagePath = 'reference/UI_Image.png';
  const outDir = path.join('reference', 'focused_slices');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Let's crop specific regions based on typical landing page sections or precise coordinates if we want.
  // Wait, let's write a script that crops specific areas or lets us inspect.
  // Actually let's crop 1000px height chunks from top 0 to 20096, but let's also make them wider (e.g. width 3816 or 7632 resized to 2000).
  const regions = [
    { name: 'hero_stats', top: 0, height: 4000 },
    { name: 'stats_projects_satisfaction', top: 3500, height: 4000 },
    { name: 'seo_rating', top: 7000, height: 4000 },
    { name: 'case_studies', top: 10500, height: 4000 },
    { name: 'pricing', top: 14500, height: 5596 }
  ];

  let html = '<html><body style="background:#111; color:#fff; font-family:sans-serif;"><h1>Focused Slices</h1>';
  for (const reg of regions) {
    const filename = `${reg.name}.png`;
    const filepath = path.join(outDir, filename);
    await sharp(imagePath)
      .extract({ left: 0, top: reg.top, width: 7632, height: reg.height })
      .resize({ width: 1600 })
      .png()
      .toFile(filepath);
    html += `<h2>${reg.name} (top: ${reg.top}, height: ${reg.height})</h2><img src="${filename}" style="width:100%; border:1px solid #444;"/><hr/>`;
  }
  html += '</body></html>';
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log('Focused slices created.');
}
run();
