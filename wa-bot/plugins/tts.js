const axios = require('axios');
module.exports = {
  name: 'tts',
  run: async ({ m }) => {
    if (!m.isCmd || m.command !== 'tts') return;
    if (!m.text) return m.reply('❌ Contoh: .tts Halo dunia');
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(m.text)}&tl=id&client=tw-ob`;
      const { data } = await axios.get(url, { responseType: 'arraybuffer' });
      await m.send({
        audio: Buffer.from(data),
        mimetype: 'audio/mpeg',
        ptt: true
      });
    } catch (e) {
      m.reply('❌ Gagal TTS: ' + e.message);
    }
  }
};
