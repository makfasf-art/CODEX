const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('ffmpeg-static');
module.exports = {
  name: 'stickervid',
  run: async ({ m }) => {
    if (!m.isCmd || !['stickervid', 'sv'].includes(m.command)) return;
    if (!m.quoted?.videoMessage) return m.reply('❌ Reply video pendek dengan .stickervid');
    const tmpIn = path.join(__dirname, '..', 'temp', `in_${Date.now()}.mp4`);
    const tmpOut = path.join(__dirname, '..', 'temp', `out_${Date.now()}.webp`);
    try {
      const buf = await m.download();
      fs.writeFileSync(tmpIn, buf);
      await new Promise((res, rej) => {
        exec(`"${ffmpeg}" -i "${tmpIn}" -vcodec libwebp -filter:v "fps=15,scale=512:-1" -lossless 0 -compression_level 6 -q:v 50 -loop 0 -preset default -an -vsync 0 "${tmpOut}"`,
          (e) => e ? rej(e) : res());
      });
      await m.send({ sticker: fs.readFileSync(tmpOut) });
    } catch (e) {
      m.reply('❌ ' + e.message);
    } finally {
      try { fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); } catch {}
    }
  }
};
