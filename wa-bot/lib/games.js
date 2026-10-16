const NodeCache = require('node-cache');
const sessions = new NodeCache({ stdTTL: 300 });

const Games = {
  // ===== SUIT =====
  async suit({ m, sock }) {
    await m.sendButtons('🎮 GAME SUIT', 'Pilih senjata kamu:', [
      { text: '✊ Batu', id: '.suit batu' },
      { text: '✋ Kertas', id: '.suit kertas' },
      { text: '✌️ Gunting', id: '.suit gunting' }
    ]);
  },

  async suitPlay({ m }) {
    const p = m.text.toLowerCase();
    const valid = ['batu', 'kertas', 'gunting'];
    if (!valid.includes(p)) return m.reply('❌ Pilih: batu / kertas / gunting');
    const bot = valid[Math.floor(Math.random() * 3)];
    let hasil = '';
    if (p === bot) hasil = '🤝 SERI!';
    else if (
      (p === 'batu' && bot === 'gunting') ||
      (p === 'kertas' && bot === 'batu') ||
      (p === 'gunting' && bot === 'kertas')
    ) hasil = '🏆 KAMU MENANG!';
    else hasil = '💀 KAMU KALAH!';
    await m.sendButtons('🎮 HASIL SUIT',
      `Kamu: *${p}*\nBot: *${bot}*\n\n${hasil}`,
      [{ text: '🔄 Main Lagi', id: '.suit' }]
    );
  },

  // ===== TEBAK ANGKA =====
  async tebak({ m }) {
    const num = Math.floor(Math.random() * 100) + 1;
    sessions.set(`tebak_${m.sender}`, num);
    await m.reply(`🎯 Aku pikirkan angka 1-100!\nKetik *.jawab <angka>* untuk menebak.`);
  },

  async jawab({ m }) {
    const num = sessions.get(`tebak_${m.sender}`);
    if (!num) return m.reply('❌ Belum ada game. Ketik *.tebak*');
    const guess = parseInt(m.text);
    if (isNaN(guess)) return m.reply('❌ Angka tidak valid');
    if (guess === num) {
      sessions.del(`tebak_${m.sender}`);
      return m.sendButtons('🎉 BENAR!', `Angkanya *${num}*! Kamu hebat!`,
        [{ text: '🔄 Main Lagi', id: '.tebak' }]);
    }
    const hint = guess < num ? '📈 Terlalu KECIL' : '📉 Terlalu BESAR';
    m.reply(`${hint}\nCoba lagi!`);
  },

  // ===== MATH QUIZ =====
  async math({ m }) {
    const a = Math.floor(Math.random() * 50) + 1;
    const b = Math.floor(Math.random() * 50) + 1;
    const op = ['+', '-', '×'][Math.floor(Math.random() * 3)];
    let ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
    sessions.set(`math_${m.sender}`, ans);
    const opt = [ans, ans + Math.floor(Math.random() * 10) + 1, ans - Math.floor(Math.random() * 10) - 1, ans + 2];
    opt.sort(() => Math.random() - 0.5);
    await m.sendButtons('🧮 MATH QUIZ', `Berapa *${a} ${op} ${b}*?`,
      opt.map(o => ({ text: String(o), id: `.mathans ${o}` }))
    );
  },

  async mathAns({ m }) {
    const ans = sessions.get(`math_${m.sender}`);
    if (!ans) return m.reply('❌ Belum ada soal');
    const g = parseInt(m.text);
    if (g === ans) {
      sessions.del(`math_${m.sender}`);
      return m.sendButtons('✅ BENAR!', `Jawaban: *${ans}*`, [{ text: '🔄 Soal Baru', id: '.math' }]);
    }
    m.reply(`❌ Salah! Coba lagi.`);
  }
};

module.exports = { Games };
