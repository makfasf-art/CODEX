const sharp = require('sharp');
module.exports = {
  name: 'sticker',
  run: async ({ m }) => {
    if (!m.isCmd || !['sticker', 's', 'stiker'].includes(m.command)) return;
    if (!m.quoted) return m.reply('❌ Reply gambar/video dengan .sticker');
    try {
      const buf = await m.download();
      let webp;
      if (m.quoted.imageMessage) {
        webp = await sharp(buf).resize(512, 512, { fit: 'inside' }).webp().toBuffer();
      } else {
        return m.reply('❌ Format tidak didukung, pakai .stickervid untuk video');
      }
      await m.send({ sticker: webp });
    } catch (e) {
      m.reply('❌ ' + e.message);
    }
  }
};
