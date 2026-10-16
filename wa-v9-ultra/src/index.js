require('dotenv').config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { start, move, render, games } = require('./game');
const { spawn } = require('child_process');

const PREFIX = process.env.PREFIX || '.';
const BOT = process.env.BOT_NAME || 'V9 ULTRA';
const OWNER = (process.env.OWNER_NUMBER || '').replace(/\D/g, '');
const PAIR = (process.env.PAIRING_NUMBER || '').replace(/\D/g, '');

function menu() {
  return `╭━━━〔 ${BOT} 〕━━━╮
│ 🔐 .ping
│ 📋 .menu
│ 🎮 .ttt
│ 🎯 .move 1-9
│ 🛑 .tttstop
│ 🧮 .calc 2+2
│ 🎲 .roll
│ 🪙 .coin
│ 🌐 .webgame
│ 👑 .owner
╰━━━━━━━━━━━━━━╯
Fitur aktif dasar: 10
Katalog 350 fitur belum berarti semuanya terimplementasi.`;
}

async function main() {
  const { state, saveCreds } =
    await useMultiFileAuthState('./session');
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['V9 ULTRA', 'Chrome', '9.0'],
    markOnlineOnConnect: false
  });

  sock.ev.on('creds.update', saveCreds);

  if (!sock.authState.creds.registered && PAIR) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(PAIR);
        console.log('PAIRING CODE:', code);
      } catch (e) {
        console.error('Pairing gagal:', e.message);
      }
    }, 2500);
  }

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'open') console.log(`${BOT} terhubung.`);
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log('Koneksi tertutup:', code || 'unknown');
      if (code !== DisconnectReason.loggedOut) {
        setTimeout(main, 3000);
      } else {
        console.log('Session logout. Hapus session lalu pairing ulang.');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      if (!m.message || m.key.fromMe) continue;
      const chat = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;
      const text = m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        m.message.videoMessage?.caption || '';
      if (!text.startsWith(PREFIX)) continue;

      const [cmdRaw, ...args] = text.slice(PREFIX.length).trim().split(/\s+/);
      const cmd = (cmdRaw || '').toLowerCase();
      const arg = args.join(' ');
      const reply = t => sock.sendMessage(chat, { text: String(t) }, { quoted: m });

      try {
        if (cmd === 'menu' || cmd === 'help') await reply(menu());
        else if (cmd === 'ping') await reply('Pong! ⚡');
        else if (cmd === 'owner') await reply(OWNER ? `Owner: ${OWNER}` : 'OWNER_NUMBER belum diatur di .env');
        else if (cmd === 'webgame') await reply(`Web game aktif di server. Buka http://ALAMAT-SERVER:${process.env.PORT || 3000} pada perangkat yang dapat mengakses server.`);
        else if (cmd === 'roll') await reply(`🎲 ${1 + Math.floor(Math.random() * 6)}`);
        else if (cmd === 'coin') await reply(Math.random() < .5 ? '🪙 Angka' : '🪙 Gambar');
        else if (cmd === 'calc') {
          const match = arg.match(/^(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)$/);
          if (!match) return reply('Contoh: .calc 12*3');
          const a = Number(match[1]), op = match[2], b = Number(match[3]);
          const result = op === '+' ? a+b : op === '-' ? a-b :
            op === '*' ? a*b : b === 0 ? 'Tidak bisa dibagi nol' : a/b;
          await reply(`🧮 ${result}`);
        } else if (cmd === 'ttt') {
          start(chat, sender);
          await reply('🎮 Tic-Tac-Toe dimulai!\n' + render(games.get(chat).board) +
            '\nKetik .move 1 sampai 9. Kamu bermain X melawan O bergantian.');
        } else if (cmd === 'move') {
          const n = Number(args[0]);
          const result = move(chat, n, sender);
          if (result.error) return reply(result.error);
          await reply(result.board + (result.result
            ? '\n' + (result.result === 'draw' ? 'Seri!' : `Pemenang: ${result.result}`)
            : `\nGiliran: ${result.turn}`));
        } else if (cmd === 'tttstop') {
          games.delete(chat);
          await reply('Game dihentikan.');
        } else {
          await reply('Perintah tidak dikenal. Ketik .menu');
        }
      } catch (e) {
        console.error('Handler error:', e);
        await reply('Terjadi error saat menjalankan perintah.');
      }
    }
  });
}
main().catch(console.error);
