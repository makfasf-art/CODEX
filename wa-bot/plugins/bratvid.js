const sharp = require('sharp');
module.exports = {
  name: 'bratvid',
  run: async ({ m }) => {
    if (!m.isCmd || m.command !== 'bratvid') return;
    if (!m.text) return m.reply('❌ Contoh: .bratvid halo');
    try {
      const frames = 10;
      const buffers = [];
      for (let i = 0; i < frames; i++) {
        const svg = `<svg width="512" height="512"><rect width="512" height="512" fill="#fff"/>
        <text x="${20 + i * 5}" y="256" font-family="Arial" font-size="40" font-weight="bold"
        fill="#000">${m.text.replace(/[<>&]/g,'')}</text></svg>`;
        buffers.push(await sharp(Buffer.from(svg)).webp().toBuffer());
      }
      await m.send({ sticker: buffers[0] });
      m.reply('💡 Untuk animasi penuh, install ffmpeg & pakai API bratvid.');
    } catch (e) {
      m.reply('❌ ' + e.message);
    }
  }
};
