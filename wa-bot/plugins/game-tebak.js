const { Games } = require('../lib/games');
module.exports = {
  name: 'game-tebak',
  run: async (ctx) => {
    const { m } = ctx;
    if (!m.isCmd) return;
    if (m.command === 'tebak') return Games.tebak(ctx);
    if (m.command === 'jawab') return Games.jawab(ctx);
  }
};
