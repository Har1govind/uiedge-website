const fs = require("fs");
const path = require("path");
const https = require("https");

// (live image id, destination path) — full quality (no width query params)
const MISSING = [
  // Service card thumbnails (12 × 140×140)
  ["vGSJoy0fkCYvuK5CETUzS64NNo.jpg", "public/images/services/icon-1.jpg"],
  ["6xxZ3D6rnu26P86nUVvj2eanCY.jpg", "public/images/services/icon-2.jpg"],
  ["6girwIRKdg1doDEWAHr4oDIbroU.jpg", "public/images/services/icon-3.jpg"],
  ["DsMKi7qE5JNWO5UQxmeqZGDSOI.jpg", "public/images/services/icon-4.jpg"],
  ["PTZo29JDyFUqhP5lmoOwf726M.jpg", "public/images/services/icon-5.jpg"],
  ["2BxeG0o2qWf8AOHmXP5mvB7fXo.jpg", "public/images/services/icon-6.jpg"],
  ["qQlR5lTiRYzT2lPzSWLLVkcgH6Y.jpg", "public/images/services/icon-7.jpg"],
  ["PzUf5VcgXOfitprgtvScN6spik.jpg", "public/images/services/icon-8.jpg"],
  ["7HAgaIAjq6jlYJoi8ME87oXs6w.jpg", "public/images/services/icon-9.jpg"],
  ["9hTP0obDSaEcVCyC5kaHbx7FfI.jpg", "public/images/services/icon-10.jpg"],
  ["zhgLgjCtsbVWTYRQuFeBf3XoW6c.jpg", "public/images/services/icon-11.jpg"],
  ["OvxlgM3dgsl1n9Hl1FAnutk3YQ.jpg", "public/images/services/icon-12.jpg"],
  // Showreel image (1912×1402) + video poster (1920×1080)
  ["vrhxHFTuxnCduP4nljUulqZcuQ.jpg", "public/images/showreel.jpg"],
  ["ZJ6HLYoAxMXsbBJCnggXHSRug.jpg", "public/images/showreel-poster.jpg"],
  // Team portraits (tall, big)
  ["stTKqZkueiEGiXkUexOWo9RjNnY.jpg", "public/images/team/lauren-tall.jpg"],
  ["3Rw5vNnsCjiRaizUQ1G8JkxJxo.jpg", "public/images/team/george-tall.jpg"],
  // Clients section pattern + ellipse
  ["rR6HYXBrMmX4cRpXfXUOvpvpB0.png", "public/images/clients-pattern.png"],
  ["mARXSQIQaDhUf6ZRpDnRzU235g.jpg", "public/images/ellipse.jpg"],
  // Testimonial avatar full-res ("User Image" 7XElic/D53nCb/fqOOP + lVMA2B)
  ["7XElicIcn53vdnwyFHTpct98.jpg", "public/images/testimonials/james-full.jpg"],
  ["D53nCbgrC45WamdByYxomUf9c.jpg", "public/images/testimonials/emily-full.jpg"],
  ["fqOOPJWEd96G4368QW9n1dcVU.jpg", "public/images/testimonials/anna-full.jpg"],
  ["lVMA2BWo8D0yz8GINpzGpDx4.jpg", "public/images/testimonials/rating-full.jpg"],
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(dest + " -> HTTP " + res.statusCode));
        return;
      }
      res.pipe(file);
      file.on("finish", () => { file.close(resolve); });
    });
    req.on("error", (e) => { file.close(); fs.unlink(dest, () => {}); reject(e); });
  });
}

(async () => {
  let ok = 0, fail = 0;
  for (const [id, dest] of MISSING) {
    const url = "https://framerusercontent.com/images/" + id;
    try {
      await download(url, dest);
      const bytes = fs.statSync(dest).size;
      console.log("OK  ", dest, bytes + " bytes");
      ok++;
    } catch (e) {
      console.log("FAIL", dest, e.message);
      fail++;
    }
  }
  console.log("\nDownloaded:", ok, "failed:", fail);
})();
