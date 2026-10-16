const WebSocket = require('ws');
const config = require('../config');

function startWebSocket(sock) {
  const wss = new WebSocket.Server({ port: config.wsPort });
  console.log(`🌐 WebSocket: ws://localhost:${config.wsPort}`);

  wss.on('connection', (ws) => {
    console.log('🔌 Client connected');
    ws.send(JSON.stringify({ type: 'welcome', msg: 'NEXUS-BOT WS Ready' }));

    ws.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw);
        if (data.token !== config.botToken) return ws.send(JSON.stringify({ error: 'invalid token' }));
        if (data.action === 'send') {
          await sock.sendMessage(data.to, { text: data.text });
          ws.send(JSON.stringify({ ok: true }));
        }
        if (data.action === 'ping') ws.send(JSON.stringify({ pong: Date.now() }));
      } catch (e) {
        ws.send(JSON.stringify({ error: e.message }));
      }
    });
  });

  sock.ev.on('messages.upsert', ({ messages }) => {
    const m = messages[0];
    if (!m?.message) return;
    wss.clients.forEach(c => {
      if (c.readyState === WebSocket.OPEN) {
        c.send(JSON.stringify({ type: 'message', from: m.key.remoteJid, pushName: m.pushName }));
      }
    });
  });

  return wss;
}

module.exports = { startWebSocket };
