const { Games } = require('../lib/games');
module.exports = {
  name: 'game-math',
  run: async (ctx) => {
    const { m } = ctx;
    if (!m.isCmd) return;
    if (m.command === 'math') return Games.math(ctx);
    if (m.command === 'mathans') return Games.mathAns(ctx);
  }
};
