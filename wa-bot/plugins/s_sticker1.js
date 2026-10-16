
const sharp = require('sharp');
module.exports = { name: 'sticker1', run: async ({ m }) => {
  if (!m.isCmd || m.command !== 'sticker1') return;
  if (!m.quoted) return m.reply('❌ Reply gambar dengan .sticker1');
  try {
    const buf = await m.download();
    const webp = await sharp(buf).resize(512, 512, { fit: 'inside' }).webp({ quality: 80 }).toBuffer();
    await m.send({ sticker: webp });
  } catch (e) { m.reply('❌ ' + e.message); }
}};