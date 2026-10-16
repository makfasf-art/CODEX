const sharp = require('sharp');
const axios = require('axios');
module.exports = {
  name: 'brat',
  run: async ({ m }) => {
    if (!m.isCmd || m.command !== 'brat') return;
    if (!m.text) return m.reply('❌ Contoh: .brat halo dunia');
    try {
      const url = `https://api.lolhuman.xyz/api/brat?apikey=YOUR_KEY&text=${encodeURIComponent(m.text)}`;
      // fallback lokal: pakai sharp text generator
      const svg = `<svg width="512" height="512"><rect width="512" height="512" fill="#fff"/>
      <text x="256" y="256" font-family="Arial" font-size="40" font-weight="bold"
      text-anchor="middle" dominant-baseline="middle" fill="#000">${m.text.replace(/[<>&]/g,'')}</text></svg>`;
      const webp = await sharp(Buffer.from(svg)).webp().toBuffer();
      await m.send({ sticker: webp });
    } catch (e) {
      m.reply('❌ ' + e.message);
    }
  }
};
