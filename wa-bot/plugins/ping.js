module.exports = {
  name: 'ping',
  run: async ({ m }) => {
    if (!m.isCmd || m.command !== 'ping') return;
    const t = Date.now();
    await m.reply('🏓 Pong!');
    m.reply(`⚡ ${Date.now() - t}ms`);
  }
};
