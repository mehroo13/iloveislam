// tools/convert-images.js
// Node script to convert PNG/JPEG images in ./public to WebP using sharp.
// Usage: `npm install sharp --save-dev` then `node tools/convert-images.js`

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
const outDir = path.join(publicDir, 'optimized');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

async function convert(file) {
  const input = path.join(publicDir, file);
  const name = path.parse(file).name;
  const out = path.join(outDir, `${name}.webp`);
  try {
    await sharp(input).webp({ quality: 80 }).toFile(out);
    console.log('Converted', file, '→', out);
  } catch (err) { console.error('Error converting', file, err); }
}

const files = fs.readdirSync(publicDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
(async () => {
  for (const f of files) {
    await convert(f);
  }
})();
