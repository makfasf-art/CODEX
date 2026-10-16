
const sharp = require('sharp');
module.exports = { name: 'sticker4', run: async ({ m }) => {
  if (!m.isCmd || m.command !== 'sticker4') return;
  if (!m.quoted) return m.reply('❌ Reply gambar dengan .sticker4');
  try {
    const buf = await m.download();
    const webp = await sharp(buf).resize(512, 512, { fit: 'inside' }).webp({ quality: 80 }).toBuffer();
    await m.send({ sticker: webp });
  } catch (e) { m.reply('❌ ' + e.message); }
}};