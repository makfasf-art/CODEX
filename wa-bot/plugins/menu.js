module.exports = {
  name: 'menu',
  run: async ({ m, config }) => {
    if (!m.isCmd) return;
    if (m.command === 'menu' || m.command === 'help') {
      await m.sendList(config.botName + ' MENU', 'Pilih kategori fitur:', '📂 Buka Menu', [
        { title: '🎮 GAMES', rows: [
          { title: 'Suit', id: '.suit', description: 'Gunting batu kertas' },
          { title: 'Tebak Angka', id: '.tebak', description: '1-100' },
          { title: 'Math Quiz', id: '.math', description: 'Hitung cepat' }
        ]},
        { title: '🎨 STICKER & MEDIA', rows: [
          { title: 'Sticker', id: '.sticker', description: 'Img → Sticker' },
          { title: 'Sticker Vid', id: '.stickervid', description: 'Vid → Sticker' },
          { title: 'Brat', id: '.brat', description: 'Text brat style' },
          { title: 'Brat Vid', id: '.bratvid', description: 'Brat animasi' },
          { title: 'TTS', id: '.tts', description: 'Text to speech' }
        ]},
        { title: '📢 STATUS', rows: [
          { title: 'Status Group', id: '.statusgroup', description: 'Kirim ke status grup' }
        ]}
      ]);
    }
  }
};
