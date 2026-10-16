const { Games } = require('../lib/games');
module.exports = {
  name: 'game-suit',
  run: async (ctx) => {
    const { m } = ctx;
    if (!m.isCmd || m.command !== 'suit') return;
    if (['batu', 'kertas', 'gunting'].includes(m.args[0])) return Games.suitPlay(ctx);
    return Games.suit(ctx);
  }
};
