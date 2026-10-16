module.exports = {
  name: 'statusgroup',
  run: async ({ m, sock }) => {
    if (!m.isCmd || m.command !== 'statusgroup') return;
    if (!m.isGroup) return m.reply('❌ Hanya di grup');
    const text = m.text || 'Status update from bot';
    try {
      // Kirim sebagai pesan biasa + mention semua
      const meta = await sock.groupMetadata(m.chat);
      const mentions = meta.participants.map(p => p.id);
      await sock.sendMessage(m.chat, {
        text: `📢 *STATUS GROUP*\n\n${text}`,
        mentions
      });
      m.react('✅');
    } catch (e) {
      m.reply('❌ ' + e.message);
    }
  }
};
