const { startSocket } = require('./lib/socket');
const { startWebSocket } = require('./lib/websocket');
const chalk = require('chalk');
const config = require('./config');

console.log(chalk.cyan(`
╔══════════════════════════════════════╗
║   ${config.botName}  |  670+ Features 🚀
║   Baileys + Rich Interactive
╚══════════════════════════════════════╝
`));

(async () => {
  const sock = await startSocket();
  startWebSocket(sock);
})();
