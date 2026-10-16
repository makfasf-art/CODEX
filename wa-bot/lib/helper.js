const { getContentType, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const config = require('../config');

function getPrefix(body) {
  if (!body) return null;
  return config.prefix.find(p => body.startsWith(p)) || null;
}

async function MessageParser(sock, msg) {
  try {
    const chat = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const isGroup = chat.endsWith('@g.us');
    const type = getContentType(msg.message);
    if (!type) return null;

    let body = '';
    if (type === 'conversation') body = msg.message.conversation;
    else if (type === 'extendedTextMessage') body = msg.message.extendedTextMessage.text;
    else if (type === 'imageMessage') body = msg.message.imageMessage.caption || '';
    else if (type === 'videoMessage') body = msg.message.videoMessage.caption || '';
    else if (type === 'buttonsResponseMessage') body = msg.message.buttonsResponseMessage.selectedButtonId;
    else if (type === 'listResponseMessage') body = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
    else if (type === 'interactiveResponseMessage') {
      try {
        const native = msg.message.interactiveResponseMessage.nativeFlowResponseMessage;
        body = JSON.parse(native.paramsJson || '{}').id || '';
      } catch { body = ''; }
    }
    else if (type === 'templateButtonReplyMessage') body = msg.message.templateButtonReplyMessage.selectedId;

    const prefix = getPrefix(body);
    const isCmd = !!prefix;
    let command = '', args = [], text = '';
    if (isCmd) {
      const slice = body.slice(prefix.length).trim();
      command = slice.split(/\s+/)[0].toLowerCase();
      args = slice.split(/\s+/).slice(1);
      text = slice.slice(command.length).trim();
    }

    const quoted = msg.message[type]?.contextInfo?.quotedMessage || null;

    const m = {
      key: msg.key, chat, sender, isGroup, type, body,
      prefix, isCmd, command, args, text, quoted,
      pushName: msg.pushName,
      mentionedJid: msg.message[type]?.contextInfo?.mentionedJid || [],
      isBot: msg.key.fromMe,

      reply: (text, opts = {}) => sock.sendMessage(chat, { text, ...opts }, { quoted: msg }),
      send: (content, opts = {}) => sock.sendMessage(chat, content, opts),
      react: (emoji) => sock.sendMessage(chat, { react: { text: emoji, key: msg.key } }),

      download: async () => {
        const stream = await downloadContentFromMessage(
          msg.message[type], type.replace('Message', '')
        );
        let buf = Buffer.from([]);
        for await (const c of stream) buf = Buffer.concat([buf, c]);
        return buf;
      },

      // ===== RICH INTERACTIVE (tombol alternatif) =====
      sendButtons: async (title, text, buttons = []) => {
        try {
          return await sock.sendMessage(chat, {
            text,
            footer: title,
            interactiveButtons: buttons.map(b => ({
              name: 'quick_reply',
              buttonParamsJson: JSON.stringify({ display_text: b.text, id: b.id })
            }))
          }, { quoted: msg });
        } catch {
          const list = buttons.map((b, i) => `${i + 1}. ${b.text}`).join('\n');
          return sock.sendMessage(chat, {
            text: `*${title}*\n\n${text}\n\n${list}\n\n_Balas angka atau ID_`
          }, { quoted: msg });
        }
      },

      sendList: async (title, text, buttonText, sections = []) => {
        try {
          return await sock.sendMessage(chat, {
            text,
            footer: title,
            interactiveButtons: [{
              name: 'single_select',
              buttonParamsJson: JSON.stringify({ title: buttonText, sections })
            }]
          }, { quoted: msg });
        } catch {
          let t = `*${title}*\n\n${text}\n\n`;
          sections.forEach(s => {
            t += `*${s.title}*\n`;
            s.rows.forEach(r => { t += `• ${r.title} (${r.id})\n`; });
            t += '\n';
          });
          return sock.sendMessage(chat, { text: t }, { quoted: msg });
        }
      }
    };

    return m;
  } catch (e) {
    console.error('Parser error:', e.message);
    return null;
  }
}

module.exports = { MessageParser, getPrefix };
