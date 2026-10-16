const fs = require('fs');
const path = require('path');

async function loadPlugins() {
  const dir = path.join(__dirname, '..', 'plugins');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  const plugins = {};
  for (const file of files) {
    try {
      delete require.cache[require.resolve(path.join(dir, file))];
      const p = require(path.join(dir, file));
      if (p && p.name) plugins[p.name] = p;
    } catch (e) {
      console.error(`[Loader] ${file}:`, e.message);
    }
  }
  return plugins;
}

module.exports = { loadPlugins };
