const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { loadPlugins } = require('./loader');
const { MessageParser } = require('./helper');

const logger = P({ level: 'silent' });

async function startSocket() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, '..', config.sessionName)
  );
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: [config.botName, 'Chrome', '120.0.0'],
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: true
  });

  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      console.log('[QR] Scan sekarang:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') console.log('✅ BOT CONNECTED');
    else if (connection === 'close') {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        console.log('🔄 Reconnect...');
        startSocket();
      } else {
        fs.rmSync(path.join(__dirname, '..', config.sessionName), { recursive: true, force: true });
        startSocket();
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  const plugins = await loadPlugins();
  console.log(`📦 Loaded ${Object.keys(plugins).length} commands`);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message) return;

    const m = await MessageParser(sock, msg);
    if (!m) return;

    if (config.autoRead) await sock.readMessages([msg.key]);
    if (config.autoTyping && m.body) {
      await sock.sendPresenceUpdate('composing', m.chat);
    }

    for (const name in plugins) {
      try {
        await plugins[name].run({ sock, m, plugins, config });
      } catch (e) {
        console.error(`[ERR ${name}]`, e.message);
      }
    }
  });

  return sock;
}

module.exports = { startSocket };
