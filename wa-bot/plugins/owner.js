module.exports = {
  name: 'owner',
  run: async ({ m, config }) => {
    if (!m.isCmd || m.command !== 'owner') return;
    m.reply(`👑 Owner: ${config.owner.join(', ')}`);
  }
};
